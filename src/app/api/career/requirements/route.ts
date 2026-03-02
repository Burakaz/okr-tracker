import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET: Fetch all requirement completions for the current user
export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/career/requirements", {
    requestId,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Nicht authentifiziert" },
            { status: 401 }
          )
        )
      );
    }

    const serviceClient = await createServiceClient();

    const { data: completions, error } = await serviceClient
      .from("career_requirement_completions")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      logger.error("Requirement completions query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Anforderungen" },
            { status: 500 }
          )
        )
      );
    }

    reqLog.finish(200, { userId: user.id, count: completions?.length ?? 0 });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ completions: completions ?? [] }))
    );
  } catch (error) {
    logger.error("GET /api/career/requirements unhandled error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
      )
    );
  }
}

// POST: Upsert a requirement completion (toggle status, update notes)
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("POST", "/api/career/requirements", {
    requestId,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Nicht authentifiziert" },
            { status: 401 }
          )
        )
      );
    }

    const body = await req.json();
    const {
      career_path_id,
      level_id,
      requirement_index,
      status,
      notes,
    } = body;

    // Validate required fields
    if (
      !career_path_id ||
      !level_id ||
      requirement_index === undefined ||
      requirement_index === null
    ) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "career_path_id, level_id und requirement_index sind erforderlich" },
            { status: 400 }
          )
        )
      );
    }

    // Validate status
    const validStatuses = ["not_started", "in_progress", "completed"];
    if (status && !validStatuses.includes(status)) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültiger Status" },
            { status: 400 }
          )
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Get user's organization
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Organisation zugeordnet" },
            { status: 400 }
          )
        )
      );
    }

    // If status is "not_started", delete the record (clean state)
    if (status === "not_started") {
      await serviceClient
        .from("career_requirement_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("career_path_id", career_path_id)
        .eq("level_id", level_id)
        .eq("requirement_index", requirement_index);

      reqLog.finish(200, { userId: user.id, action: "deleted" });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ success: true, deleted: true }))
      );
    }

    // Upsert the completion
    const upsertData = {
      user_id: user.id,
      organization_id: profile.organization_id,
      career_path_id,
      level_id,
      requirement_index,
      status: status || "in_progress",
      notes: notes ?? null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: completion, error } = await serviceClient
      .from("career_requirement_completions")
      .upsert(upsertData, {
        onConflict: "user_id,career_path_id,level_id,requirement_index",
      })
      .select()
      .single();

    if (error) {
      logger.error("Requirement completion upsert failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Speichern" },
            { status: 500 }
          )
        )
      );
    }

    reqLog.finish(200, { userId: user.id, action: "upserted" });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ completion }))
    );
  } catch (error) {
    logger.error("POST /api/career/requirements unhandled error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
      )
    );
  }
}
