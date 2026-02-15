import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCheckinSchema } from "@/lib/validation";
import { logCheckinCreate } from "@/lib/audit";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

// Minimum seconds between check-ins to prevent double-submits
const CHECKIN_COOLDOWN_SECONDS = 30;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: okrId } = await params;
  const reqLog = logger.request("GET", `/api/okrs/${okrId}/checkin`, { requestId });

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
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Verify the user owns the OKR
    const { data: okr, error: okrError } = await serviceClient
      .from("okrs")
      .select("id, user_id")
      .eq("id", okrId)
      .eq("user_id", user.id)
      .single();

    if (okrError || !okr) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "OKR nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    const { data: checkins, error } = await serviceClient
      .from("okr_checkins")
      .select("*")
      .eq("okr_id", okrId)
      .order("checked_at", { ascending: false });

    if (error) {
      logger.error("Checkin list query failed", {
        requestId,
        userId: user.id,
        okrId,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Check-ins" },
            { status: 500 }
          )
        )
      );
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ checkins: checkins || [] })
      )
    );
  } catch (error) {
    logger.error("GET /api/okrs/[id]/checkin unhandled error", {
      requestId,
      okrId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    reqLog.finish(500);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: okrId } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${okrId}/checkin`, { requestId });

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
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültiger JSON-Body" },
            { status: 400 }
          )
        )
      );
    }

    const parsed = createCheckinSchema.safeParse(body);

    if (!parsed.success) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Validierungsfehler", details: parsed.error.flatten() },
            { status: 400 }
          )
        )
      );
    }

    const data = parsed.data;
    const serviceClient = await createServiceClient();

    // Verify user owns the OKR and fetch current state
    const { data: okr, error: okrError } = await serviceClient
      .from("okrs")
      .select("id, user_id, organization_id, is_active, progress")
      .eq("id", okrId)
      .eq("user_id", user.id)
      .single();

    if (okrError || !okr) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "OKR nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    if (!okr.is_active) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Check-in für archivierte OKRs nicht möglich" },
            { status: 400 }
          )
        )
      );
    }

    // Duplicate check-in guard: prevent rapid double-submits
    const cooldownThreshold = new Date(
      Date.now() - CHECKIN_COOLDOWN_SECONDS * 1000
    ).toISOString();

    const { data: recentCheckins, error: recentError } = await serviceClient
      .from("okr_checkins")
      .select("id, checked_at")
      .eq("okr_id", okrId)
      .eq("user_id", user.id)
      .gte("checked_at", cooldownThreshold)
      .order("checked_at", { ascending: false })
      .limit(1);

    if (!recentError && recentCheckins && recentCheckins.length > 0) {
      logger.warn("Checkin rate-limited", {
        requestId,
        userId: user.id,
        okrId,
      });
      reqLog.finish(429, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error: `Bitte warten Sie ${CHECKIN_COOLDOWN_SECONDS} Sekunden zwischen Check-ins`,
              retry_after: CHECKIN_COOLDOWN_SECONDS,
            },
            { status: 429 }
          )
        )
      );
    }

    // Update key result current_values in parallel (eliminates N+1 sequential queries)
    const krUpdateResults = await Promise.all(
      data.key_result_updates.map((krUpdate) =>
        serviceClient
          .from("key_results")
          .update({ current_value: krUpdate.current_value })
          .eq("id", krUpdate.id)
          .eq("okr_id", okrId)
      )
    );

    const failedKrUpdate = krUpdateResults.find((result) => result.error);
    if (failedKrUpdate?.error) {
      logger.error("Key result update failed during checkin", {
        requestId,
        userId: user.id,
        okrId,
        error: failedKrUpdate.error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Aktualisieren der Key Results" },
            { status: 500 }
          )
        )
      );
    }

    // Fetch the updated OKR progress (after triggers have fired)
    const { data: updatedOkr } = await serviceClient
      .from("okrs")
      .select("progress")
      .eq("id", okrId)
      .single();

    const newProgress = updatedOkr?.progress ?? okr.progress;

    // Create the check-in record
    // (triggers auto_checkin_updates: sets last_checkin_at, next_checkin_at, checkin_count, confidence)
    const { data: checkin, error: checkinError } = await serviceClient
      .from("okr_checkins")
      .insert({
        okr_id: okrId,
        user_id: user.id,
        progress_update: newProgress,
        confidence: data.confidence,
        what_helped: data.what_helped || null,
        what_blocked: data.what_blocked || null,
        next_steps: data.next_steps || null,
        change_type: "progress",
        change_details: {
          key_result_updates: data.key_result_updates,
          previous_progress: okr.progress,
          new_progress: newProgress,
        },
      })
      .select()
      .single();

    if (checkinError || !checkin) {
      logger.error("Checkin insert failed", {
        requestId,
        userId: user.id,
        okrId,
        error: checkinError?.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen des Check-ins" },
            { status: 500 }
          )
        )
      );
    }

    // Fetch the full updated OKR with key results
    const { data: fullOkr } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", okrId)
      .single();

    // Sort key_results
    if (fullOkr) {
      fullOkr.key_results = (fullOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    logCheckinCreate(
      user.id,
      okr.organization_id,
      checkin.id,
      okrId
    ).catch(() => {});

    logger.audit("checkin.created", {
      requestId,
      userId: user.id,
      okrId,
      checkinId: checkin.id,
      previousProgress: okr.progress,
      newProgress,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { checkin, okr: fullOkr },
          { status: 201 }
        )
      )
    );
  } catch (error) {
    logger.error("POST /api/okrs/[id]/checkin unhandled error", {
      requestId,
      okrId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    reqLog.finish(500);
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
