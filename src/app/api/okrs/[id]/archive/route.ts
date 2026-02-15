import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logOKRArchive, logOKRRestore } from "@/lib/audit";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${id}/archive`, { requestId });

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

    const archive = (body as Record<string, unknown>)?.archive;

    if (typeof archive !== "boolean") {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Feld 'archive' (boolean) ist erforderlich" },
            { status: 400 }
          )
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Fetch existing OKR to verify ownership
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("id, title, organization_id, user_id, is_active")
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

    // Toggle is_active (archive = set inactive, restore = set active)
    const newIsActive = !archive;

    // Idempotency: if the OKR is already in the desired state, return it without updating
    if (existingOkr.is_active === newIsActive) {
      const { data: currentOkr } = await serviceClient
        .from("okrs")
        .select("*, key_results(*)")
        .eq("id", id)
        .single();

      if (currentOkr) {
        currentOkr.key_results = (currentOkr.key_results || []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order
        );
      }

      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ okr: currentOkr }))
      );
    }

    const { data: updatedOkr, error: updateError } = await serviceClient
      .from("okrs")
      .update({ is_active: newIsActive, is_focus: false })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, key_results(*)")
      .single();

    if (updateError) {
      logger.error("OKR archive/restore failed", {
        requestId,
        userId: user.id,
        okrId: id,
        archive,
        error: updateError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Archivieren/Wiederherstellen" },
            { status: 500 }
          )
        )
      );
    }

    // Sort key_results by sort_order
    if (updatedOkr) {
      updatedOkr.key_results = (updatedOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    if (archive) {
      logOKRArchive(
        user.id,
        existingOkr.organization_id,
        id,
        existingOkr.title
      ).catch(() => {});
    } else {
      logOKRRestore(
        user.id,
        existingOkr.organization_id,
        id,
        existingOkr.title
      ).catch(() => {});
    }

    logger.audit(archive ? "okr.archived" : "okr.restored", {
      requestId,
      userId: user.id,
      okrId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ okr: updatedOkr }))
    );
  } catch (error) {
    logger.error("POST /api/okrs/[id]/archive unhandled error", {
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
