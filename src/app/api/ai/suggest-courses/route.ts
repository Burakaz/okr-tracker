import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger, generateRequestId } from "@/lib/logger";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { z } from "zod";

const requestSchema = z.object({
  craft_focus: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  okr_categories: z.array(z.string()).max(10).optional(),
});

const courseRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      reason: z.string(),
    })
  ),
});

type CourseRecommendationResponse = z.infer<typeof courseRecommendationSchema>;

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.info("POST /api/ai/suggest-courses", {
    requestId,
    method: "POST",
    path: "/api/ai/suggest-courses",
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
      logger.warn(`POST /api/ai/suggest-courses 401 ${durationMs}ms`, {
        requestId,
        method: "POST",
        path: "/api/ai/suggest-courses",
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
    let body: z.infer<typeof requestSchema>;
    try {
      const raw = await request.json();
      body = requestSchema.parse(raw);
    } catch {
      const durationMs = Date.now() - startTime;
      logger.warn(`POST /api/ai/suggest-courses 400 ${durationMs}ms`, {
        requestId,
        userId: user.id,
        method: "POST",
        path: "/api/ai/suggest-courses",
        statusCode: 400,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Ungültige Anfrage. Optionale Felder: craft_focus, department, okr_categories.",
            },
            { status: 400 }
          )
        )
      );
    }

    // Check for OPENAI_API_KEY
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

    // Build German prompt for course recommendations
    const contextParts: string[] = [];
    if (body.craft_focus) {
      contextParts.push(`Fachlicher Schwerpunkt: ${body.craft_focus}`);
    }
    if (body.department) {
      contextParts.push(`Abteilung: ${body.department}`);
    }
    if (body.okr_categories && body.okr_categories.length > 0) {
      contextParts.push(`OKR-Kategorien: ${body.okr_categories.join(", ")}`);
    }

    const contextStr =
      contextParts.length > 0
        ? `\n\nKontext des Mitarbeiters:\n${contextParts.join("\n")}`
        : "";

    const systemPrompt = `Du bist ein KI-Assistent für Personalentwicklung und Weiterbildung in einem deutschen Unternehmen.
Du empfiehlst passende Kursthemen basierend auf dem Profil und den Zielen des Mitarbeiters.
Antworte ausschließlich im JSON-Format.`;

    const userPrompt = `Empfehle 3-5 Kursthemen für die berufliche Weiterbildung.${contextStr}

Antworte im folgenden JSON-Format:
{
  "recommendations": [
    {
      "title": "Kurstitel",
      "category": "design|development|marketing|leadership|data|communication|product|other",
      "reason": "Kurze Begründung warum dieser Kurs empfohlen wird"
    }
  ]
}`;

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
    let parsed: CourseRecommendationResponse;
    try {
      const rawJson = JSON.parse(jsonStr);
      parsed = courseRecommendationSchema.parse(rawJson);
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

    const durationMs = Date.now() - startTime;
    logger.info(`POST /api/ai/suggest-courses 200 ${durationMs}ms`, {
      requestId,
      userId: user.id,
      method: "POST",
      path: "/api/ai/suggest-courses",
      statusCode: 200,
      durationMs,
      recommendationsCount: parsed.recommendations.length,
    });

    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json(parsed))
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI suggest-courses unexpected error", {
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
