import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { quickCheckinSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: okrId } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${okrId}/quick-checkin`, { requestId });

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

    const parsed = quickCheckinSchema.safeParse(body);

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
      .select("id, user_id, organization_id, is_active, progress, confidence")
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
            { error: "Quick-Check-in für archivierte OKRs nicht möglich" },
            { status: 400 }
          )
        )
      );
    }

    // Update key result current_values if provided
    if (data.key_result_updates && data.key_result_updates.length > 0) {
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
        logger.error("Key result update failed during quick-checkin", {
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
    }

    // Recalculate OKR progress (fetch updated state after key result triggers)
    const { data: updatedOkr } = await serviceClient
      .from("okrs")
      .select("progress")
      .eq("id", okrId)
      .single();

    const newProgress = updatedOkr?.progress ?? okr.progress;

    // Use provided confidence or fall back to current OKR confidence
    const confidenceValue = data.confidence ?? okr.confidence ?? 3;

    // Create the check-in record
    const now = new Date();
    const nextCheckinAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: checkin, error: checkinError } = await serviceClient
      .from("okr_checkins")
      .insert({
        okr_id: okrId,
        user_id: user.id,
        progress_update: newProgress,
        confidence: confidenceValue,
        what_helped: data.note || null,
        change_type: "progress",
        change_details: {
          quick_checkin: true,
          key_result_updates: data.key_result_updates || [],
          previous_progress: okr.progress,
          new_progress: newProgress,
        },
      })
      .select()
      .single();

    if (checkinError || !checkin) {
      logger.error("Quick-checkin insert failed", {
        requestId,
        userId: user.id,
        okrId,
        error: checkinError?.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen des Quick-Check-ins" },
            { status: 500 }
          )
        )
      );
    }

    // Update OKR confidence, last_checkin_at, next_checkin_at
    const { error: okrUpdateError } = await serviceClient
      .from("okrs")
      .update({
        confidence: confidenceValue,
        last_checkin_at: now.toISOString(),
        next_checkin_at: nextCheckinAt.toISOString(),
      })
      .eq("id", okrId);

    if (okrUpdateError) {
      logger.error("OKR update after quick-checkin failed", {
        requestId,
        userId: user.id,
        okrId,
        error: okrUpdateError.message,
      });
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

    logger.audit("quick-checkin.created", {
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
          { okr: fullOkr, checkin },
          { status: 201 }
        )
      )
    );
  } catch (error) {
    logger.error("POST /api/okrs/[id]/quick-checkin unhandled error", {
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
