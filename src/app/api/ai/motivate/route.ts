import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    // Parse stats from query params
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "du";
    const progress = parseInt(searchParams.get("progress") || "0", 10);
    const okrCount = parseInt(searchParams.get("okrCount") || "0", 10);
    const overdueCount = parseInt(searchParams.get("overdueCount") || "0", 10);
    const daysRemaining = parseInt(searchParams.get("daysRemaining") || "0", 10);

    // Check for Anthropic API key (preferred for motivational messages)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!anthropicKey && !openaiKey) {
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "AI-Service nicht konfiguriert" },
            { status: 503 }
          )
        )
      );
    }

    const systemPrompt = `Du bist ein motivierender OKR-Coach in einer App. Generiere eine kurze, persönliche Motivations-Nachricht (maximal 2 Sätze, ca. 15-25 Wörter) auf Deutsch.

Die Nachricht soll:
- Den Nutzer persönlich ansprechen (Du-Form)
- Auf die aktuellen Daten eingehen
- Positiv und ermutigend sein
- Einen konkreten, actionable Tipp oder Erkenntnis enthalten
- KEIN Emoji enthalten (wird separat hinzugefügt)

Antworte NUR mit der Nachricht, ohne Anführungszeichen oder Erklärungen.`;

    const userPrompt = `Daten:
- Durchschnittlicher OKR-Fortschritt: ${progress}%
- Aktive Ziele: ${okrCount}
- Überfällige Check-ins: ${overdueCount}
- Verbleibende Tage im Quartal: ${daysRemaining}

Generiere eine passende kurze Motivations-Nachricht.`;

    let messageText: string | undefined;

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Anthropic motivate API error", {
          requestId,
          status: response.status,
          error: errorText,
        });
      } else {
        const result = await response.json();
        messageText = result.content?.[0]?.text?.trim();
      }
    }

    // Fallback to OpenAI if Anthropic failed or not configured
    if (!messageText && openaiKey) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 150,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        messageText = result.choices?.[0]?.message?.content?.trim();
      }
    }

    // Fallback to static message if AI is not available
    if (!messageText) {
      messageText = getStaticMotivation(progress, overdueCount, daysRemaining);
    }

    const durationMs = Date.now() - startTime;
    logger.info(`GET /api/ai/motivate 200 ${durationMs}ms`, {
      requestId,
      userId: user.id,
      durationMs,
    });

    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ message: messageText })
      )
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI motivate unexpected error", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      durationMs,
    });

    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ message: getStaticMotivation(0, 0, 30) })
      )
    );
  }
}

function getStaticMotivation(
  progress: number,
  overdueCount: number,
  daysRemaining: number
): string {
  if (overdueCount > 0) {
    return "Ein kurzer Check-in hält dich auf Kurs. Nimm dir 2 Minuten und aktualisiere deine Ziele.";
  }
  if (progress >= 70) {
    return "Du bist auf der Zielgeraden! Halte den Fokus und bringe deine Ziele ins Ziel.";
  }
  if (progress >= 40) {
    return "Solider Fortschritt! Bleib dran — kleine, tägliche Schritte machen den Unterschied.";
  }
  if (daysRemaining < 14) {
    return "Die letzten Wochen zählen doppelt. Fokussiere dich auf das Wesentliche.";
  }
  return "Jeder Tag ist eine Chance, deinen Zielen einen Schritt näher zu kommen. Leg los!";
}
