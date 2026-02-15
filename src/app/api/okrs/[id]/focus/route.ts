import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logFocusToggle } from "@/lib/audit";
import { MAX_FOCUS } from "@/lib/okr-logic";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${id}/focus`, { requestId });

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

    // Fetch the OKR to verify ownership and get current state
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("id, is_focus, is_active, organization_id, quarter, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingOkr) {
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

    if (!existingOkr.is_active) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Archivierte OKRs können nicht als Fokus markiert werden" },
            { status: 400 }
          )
        )
      );
    }

    const newFocusState = !existingOkr.is_focus;

    // If setting focus to true, enforce MAX_FOCUS limit
    if (newFocusState) {
      const { count, error: countError } = await serviceClient
        .from("okrs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("quarter", existingOkr.quarter)
        .eq("is_focus", true)
        .eq("is_active", true);

      if (countError) {
        logger.error("Focus limit check failed", {
          requestId,
          userId: user.id,
          error: countError.message,
        });
        reqLog.finish(500);
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Fehler beim Prüfen des Fokus-Limits" },
              { status: 500 }
            )
          )
        );
      }

      if ((count || 0) >= MAX_FOCUS) {
        reqLog.finish(400, { userId: user.id });
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              {
                error: `Maximal ${MAX_FOCUS} Fokus-OKRs erlaubt`,
              },
              { status: 400 }
            )
          )
        );
      }
    }

    const { data: updatedOkr, error: updateError } = await serviceClient
      .from("okrs")
      .update({ is_focus: newFocusState })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, key_results(*)")
      .single();

    if (updateError) {
      logger.error("Focus toggle failed", {
        requestId,
        userId: user.id,
        okrId: id,
        error: updateError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Fokus-Toggle" },
            { status: 500 }
          )
        )
      );
    }

    // Sort key_results
    if (updatedOkr) {
      updatedOkr.key_results = (updatedOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    logFocusToggle(
      user.id,
      existingOkr.organization_id,
      id,
      newFocusState
    ).catch(() => {});

    logger.audit("okr.focus_toggled", {
      requestId,
      userId: user.id,
      okrId: id,
      newFocusState,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ okr: updatedOkr }))
    );
  } catch (error) {
    logger.error("POST /api/okrs/[id]/focus unhandled error", {
      requestId,
      okrId: id,
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
