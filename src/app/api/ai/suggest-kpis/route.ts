import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger, generateRequestId } from "@/lib/logger";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { aiSuggestResponseSchema } from "@/lib/ai/types";
import { buildCacheKey, getCached, setCache } from "@/lib/ai/cache";
import type { AISuggestRequest, AISuggestResponse } from "@/lib/ai/types";
import { z } from "zod";

const requestSchema = z.object({
  okr_title: z.string().min(3).max(500),
  category: z.enum(["performance", "skill", "learning", "career"]),
  existing_krs: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.info(`POST /api/ai/suggest-kpis`, {
    requestId,
    method: "POST",
    path: "/api/ai/suggest-kpis",
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
      logger.warn(`POST /api/ai/suggest-kpis 401 ${durationMs}ms`, {
        requestId,
        method: "POST",
        path: "/api/ai/suggest-kpis",
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
    let body: AISuggestRequest;
    try {
      const raw = await request.json();
      body = requestSchema.parse(raw);
    } catch {
      const durationMs = Date.now() - startTime;
      logger.warn(`POST /api/ai/suggest-kpis 400 ${durationMs}ms`, {
        requestId,
        userId: user.id,
        method: "POST",
        path: "/api/ai/suggest-kpis",
        statusCode: 400,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Ungültige Anfrage. Bitte OKR-Titel (min. 3 Zeichen) und Kategorie angeben.",
            },
            { status: 400 }
          )
        )
      );
    }

    // Check cache first
    const cacheKey = buildCacheKey(
      body.okr_title,
      body.category,
      body.existing_krs
    );
    const cached = getCached<AISuggestResponse>(cacheKey);
    if (cached) {
      const durationMs = Date.now() - startTime;
      logger.info(`POST /api/ai/suggest-kpis 200 ${durationMs}ms (cached)`, {
        requestId,
        userId: user.id,
        method: "POST",
        path: "/api/ai/suggest-kpis",
        statusCode: 200,
        durationMs,
        cached: true,
      });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json(cached))
      );
    }

    // Check for OPENAI_API_KEY (fallback to ANTHROPIC_API_KEY for backwards compat)
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const apiKey = openaiKey || anthropicKey;
    const useOpenAI = !!openaiKey;

    if (!apiKey) {
      logger.error("No AI API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)", { requestId });
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
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(body);

    let textContent: string | undefined;

    if (useOpenAI) {
      // Call OpenAI API
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
      // Call Anthropic API (legacy fallback)
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
    let parsed: AISuggestResponse;
    try {
      const rawJson = JSON.parse(jsonStr);
      parsed = aiSuggestResponseSchema.parse(rawJson);
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

    // Cache the result
    setCache(cacheKey, parsed);

    const durationMs = Date.now() - startTime;
    logger.info(`POST /api/ai/suggest-kpis 200 ${durationMs}ms`, {
      requestId,
      userId: user.id,
      method: "POST",
      path: "/api/ai/suggest-kpis",
      statusCode: 200,
      durationMs,
      suggestionsCount: parsed.suggestions.length,
    });

    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json(parsed))
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI suggest-kpis unexpected error", {
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
