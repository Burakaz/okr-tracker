import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger, generateRequestId } from "@/lib/logger";
import {
  withCorsHeaders,
  withRateLimitHeaders,
  checkAIRateLimit,
} from "@/lib/api-utils";
import { getCached, setCache, buildCacheKey } from "@/lib/ai/cache";
import { z } from "zod";

const requestSchema = z.object({
  course_title: z.string().min(1).max(200),
  category: z.enum([
    "design",
    "development",
    "marketing",
    "sales",
    "operations",
    "hr",
    "finance",
    "other",
  ]),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),
  description: z.string().max(500).optional(),
});

const moduleSchema = z.object({
  title: z.string(),
  estimated_minutes: z.number().min(5).max(480),
});

const responseSchema = z.object({
  modules: z.array(moduleSchema).min(2).max(8),
  suggested_description: z.string().optional(),
});

type SuggestModulesAPIResponse = z.infer<typeof responseSchema>;

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  development: "Softwareentwicklung",
  marketing: "Marketing",
  sales: "Sales & Vertrieb",
  operations: "Operations & Betrieb",
  hr: "HR & Personal",
  finance: "Finanzen & Controlling",
  other: "Allgemein",
};

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  logger.info("POST /api/ai/suggest-modules", {
    requestId,
    method: "POST",
    path: "/api/ai/suggest-modules",
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
      logger.warn(`POST /api/ai/suggest-modules 401 ${durationMs}ms`, {
        requestId,
        method: "POST",
        path: "/api/ai/suggest-modules",
        statusCode: 401,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Nicht authentifiziert" },
            { status: 401 }
          )
        )
      );
    }

    // Enforce AI rate limit
    const rateLimitResponse = checkAIRateLimit(user.id);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    let body: z.infer<typeof requestSchema>;
    try {
      const raw = await request.json();
      body = requestSchema.parse(raw);
    } catch {
      const durationMs = Date.now() - startTime;
      logger.warn(`POST /api/ai/suggest-modules 400 ${durationMs}ms`, {
        requestId,
        userId: user.id,
        method: "POST",
        path: "/api/ai/suggest-modules",
        statusCode: 400,
        durationMs,
      });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Ungueltige Anfrage. Pflichtfelder: course_title, category.",
            },
            { status: 400 }
          )
        )
      );
    }

    // Check cache
    const cacheKey = buildCacheKey(
      `modules:${body.course_title}`,
      body.category,
      body.difficulty ? [body.difficulty] : undefined
    );
    const cached = getCached<SuggestModulesAPIResponse>(cacheKey);
    if (cached) {
      const durationMs = Date.now() - startTime;
      logger.info(
        `POST /api/ai/suggest-modules 200 ${durationMs}ms (cached)`,
        {
          requestId,
          userId: user.id,
          method: "POST",
          path: "/api/ai/suggest-modules",
          statusCode: 200,
          durationMs,
          cached: true,
        }
      );
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json(cached))
      );
    }

    // Check for API keys
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

    // Sanitize input
    const sanitizedTitle = body.course_title
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
      .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
      .replace(/["\n\r\\`]/g, " ")
      .trim()
      .slice(0, 200);

    const sanitizedDescription = body.description
      ? body.description
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
          .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
          .replace(/["\n\r\\`]/g, " ")
          .trim()
          .slice(0, 500)
      : undefined;

    // Build prompts
    const categoryLabel =
      CATEGORY_LABELS[body.category] || body.category;
    const difficultyLabel = body.difficulty
      ? DIFFICULTY_LABELS[body.difficulty] || body.difficulty
      : null;

    const systemPrompt = `Du bist ein erfahrener Kursdesigner fuer berufliche Weiterbildung in einem deutschen Unternehmen.
Deine Aufgabe: Erstelle eine sinnvolle Modulstruktur fuer einen Kurs und schlage eine kurze Kursbeschreibung vor.

Regeln:
- Schlage 3-6 Module vor (nicht mehr, nicht weniger)
- Jedes Modul hat einen praezisen Titel und eine realistische Zeitschaetzung in Minuten (5-120 min pro Modul)
- Die Module sollten aufeinander aufbauen (vom Einfachen zum Komplexen)
- Die Kursbeschreibung soll 1-2 Saetze lang sein und den Mehrwert des Kurses beschreiben
- Antworte ausschliesslich im JSON-Format`;

    const contextParts: string[] = [
      `Kurstitel: "${sanitizedTitle}"`,
      `Kategorie: ${categoryLabel}`,
    ];
    if (difficultyLabel) {
      contextParts.push(`Schwierigkeitsgrad: ${difficultyLabel}`);
    }
    if (sanitizedDescription) {
      contextParts.push(`Kurzbeschreibung: ${sanitizedDescription}`);
    }

    const userPrompt = `${contextParts.join("\n")}

Erstelle eine Modulstruktur und Kursbeschreibung. Antworte im folgenden JSON-Format:
{
  "modules": [
    {
      "title": "Modultitel",
      "estimated_minutes": 30
    }
  ],
  "suggested_description": "Kurze Kursbeschreibung in 1-2 Saetzen."
}`;

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

    // Fallback to OpenAI
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
            { error: "Keine Vorschlaege generiert" },
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
    let parsed: SuggestModulesAPIResponse;
    try {
      const rawJson = JSON.parse(jsonStr);
      parsed = responseSchema.parse(rawJson);
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
            {
              error:
                "Ungueltige AI-Antwort. Bitte erneut versuchen.",
            },
            { status: 502 }
          )
        )
      );
    }

    // Cache the result
    setCache(cacheKey, parsed);

    const durationMs = Date.now() - startTime;
    logger.info(`POST /api/ai/suggest-modules 200 ${durationMs}ms`, {
      requestId,
      userId: user.id,
      method: "POST",
      path: "/api/ai/suggest-modules",
      statusCode: 200,
      durationMs,
      modulesCount: parsed.modules.length,
    });

    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json(parsed))
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI suggest-modules unexpected error", {
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
