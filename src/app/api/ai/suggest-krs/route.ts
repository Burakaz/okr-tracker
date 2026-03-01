import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { suggestKRsSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";
import { z } from "zod";

const krSuggestionSchema = z.array(
  z.object({
    title: z.string(),
    target_value: z.number(),
    unit: z.string(),
  })
);

type KRSuggestion = z.infer<typeof krSuggestionSchema>;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.info("POST /api/ai/suggest-krs", {
    requestId,
    method: "POST",
    path: "/api/ai/suggest-krs",
  });

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const durationMs = Date.now() - startTime;
      logger.warn(`POST /api/ai/suggest-krs 401 ${durationMs}ms`, {
        requestId,
        method: "POST",
        path: "/api/ai/suggest-krs",
        statusCode: 401,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    // Parse and validate request body
    let body: z.infer<typeof suggestKRsSchema>;
    try {
      const raw = await request.json();
      body = suggestKRsSchema.parse(raw);
    } catch {
      const durationMs = Date.now() - startTime;
      logger.warn(`POST /api/ai/suggest-krs 400 ${durationMs}ms`, {
        requestId,
        userId: user.id,
        method: "POST",
        path: "/api/ai/suggest-krs",
        statusCode: 400,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Ungültige Anfrage. Bitte Titel und Kategorie angeben.",
            },
            { status: 400 }
          )
        )
      );
    }

    // Check for API key
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const apiKey = openaiKey || anthropicKey;
    const useOpenAI = !!openaiKey;

    if (!apiKey) {
      logger.error(
        "No AI API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)",
        { requestId }
      );
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "AI-Service nicht konfiguriert" },
            { status: 503 }
          )
        )
      );
    }

    // Build prompts
    const systemPrompt = `Du bist ein OKR-Coach. Basierend auf dem OKR-Titel und der Kategorie, schlage 3 messbare Key Results vor. Jedes Key Result hat: title (kurz, präzise), target_value (numerisch), unit (z.B. 'Stück', '%', 'Module'). Antworte als JSON-Array.`;

    const userPrompt = `OKR-Titel: "${body.title}"
Kategorie: ${body.category}

Schlage 3 messbare Key Results vor. Antworte ausschließlich als JSON-Array im folgenden Format:
[
  {
    "title": "Key Result Titel",
    "target_value": 100,
    "unit": "Einheit"
  }
]`;

    let textContent: string | undefined;

    if (useOpenAI) {
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 1024,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
          }),
        }
      );

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        logger.error("OpenAI API error", {
          requestId,
          status: openaiResponse.status,
          error: errorText,
        });
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "AI-Service vorübergehend nicht verfügbar" },
              { status: 502 }
            )
          )
        );
      }

      const openaiResult = await openaiResponse.json();
      textContent = openaiResult.choices?.[0]?.message?.content;
    } else {
      // Anthropic fallback
      const anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-20250404",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        }
      );

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        logger.error("Anthropic API error", {
          requestId,
          status: anthropicResponse.status,
          error: errorText,
        });
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "AI-Service vorübergehend nicht verfügbar" },
              { status: 502 }
            )
          )
        );
      }

      const aiResult = await anthropicResponse.json();
      textContent = aiResult.content?.[0]?.text;
    }

    if (!textContent) {
      logger.error("Empty AI response", { requestId });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Vorschläge generiert" },
            { status: 502 }
          )
        )
      );
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = textContent;
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Parse and validate AI response
    let suggestions: KRSuggestion;
    try {
      const rawJson = JSON.parse(jsonStr);
      suggestions = krSuggestionSchema.parse(rawJson);
    } catch (parseError) {
      logger.error("Failed to parse AI response", {
        requestId,
        error:
          parseError instanceof Error ? parseError.message : "Parse error",
        rawResponse: textContent.substring(0, 500),
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültige AI-Antwort. Bitte erneut versuchen." },
            { status: 502 }
          )
        )
      );
    }

    // If category is "learning", also suggest matching courses from the database
    let recommendedCourses: { id: string; title: string; category: string; provider: string }[] | undefined;

    if (body.category === "learning") {
      const serviceClient = await createServiceClient();
      const { data: courses } = await serviceClient
        .from("courses")
        .select("id, title, category, provider")
        .eq("is_published", true)
        .limit(5);

      if (courses && courses.length > 0) {
        recommendedCourses = courses;
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info(`POST /api/ai/suggest-krs 200 ${durationMs}ms`, {
      requestId,
      userId: user.id,
      method: "POST",
      path: "/api/ai/suggest-krs",
      statusCode: 200,
      durationMs,
      suggestionsCount: suggestions.length,
    });

    const responseBody: {
      suggestions: KRSuggestion;
      recommended_courses?: typeof recommendedCourses;
    } = { suggestions };

    if (recommendedCourses) {
      responseBody.recommended_courses = recommendedCourses;
    }

    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json(responseBody))
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI suggest-krs unexpected error", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      durationMs,
    });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { error: "Interner Serverfehler" },
          { status: 500 }
        )
      )
    );
  }
}
