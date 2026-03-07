import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { suggestKRsSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders, checkAIRateLimit } from "@/lib/api-utils";
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

    // P1-FIX: Enforce AI rate limit
    const rateLimitResponse = checkAIRateLimit(user.id);
    if (rateLimitResponse) return rateLimitResponse;

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

    // Check for API keys (Anthropic preferred, OpenAI fallback)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!anthropicKey && !openaiKey) {
      logger.error(
        "No AI API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)",
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

    // P1-FIX: Sanitize user input to prevent prompt injection
    // Strip control chars, zero-width chars, and non-printable Unicode
    const sanitizedTitle = body.title
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")     // Control characters
      .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "") // Zero-width / invisible Unicode
      .replace(/["\n\r\\`]/g, " ")                         // Prompt-breaking characters
      .trim()
      .slice(0, 200);

    const userPrompt = `OKR-Titel: "${sanitizedTitle}"
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

    // Try Anthropic first (preferred)
    if (anthropicKey) {
      const anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
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
      } else {
        const aiResult = await anthropicResponse.json();
        textContent = aiResult.content?.[0]?.text;
      }
    }

    // Fallback to OpenAI if Anthropic failed or not configured
    if (!textContent && openaiKey) {
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
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
      } else {
        const openaiResult = await openaiResponse.json();
        textContent = openaiResult.choices?.[0]?.message?.content;
      }
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
      // P1-FIX: Filter courses by user's organization to prevent data leakage
      const { data: userProfile } = await serviceClient
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const { data: courses } = await serviceClient
        .from("courses")
        .select("id, title, category, provider")
        .eq("is_published", true)
        .eq("organization_id", userProfile?.organization_id || "")
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
