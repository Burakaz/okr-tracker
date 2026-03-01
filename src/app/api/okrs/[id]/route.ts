import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateOKRSchema } from "@/lib/validation";
import { logOKRUpdate, logOKRDelete } from "@/lib/audit";
import { calculateStatus } from "@/lib/okr-logic";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("GET", `/api/okrs/${id}`, { requestId });

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

    // Validate UUID format
    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige OKR-ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    const { data: okr, error } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !okr) {
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

    // Sort key_results by sort_order
    okr.key_results = (okr.key_results || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ okr }))
    );
  } catch (error) {
    logger.error("GET /api/okrs/[id] unhandled error", {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("PATCH", `/api/okrs/${id}`, { requestId });

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

    // Validate UUID format
    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige OKR-ID" }, { status: 400 })
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

    const parsed = updateOKRSchema.safeParse(body);

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

    // Fetch the existing OKR to check ownership and compute diffs
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
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

    // Calculate field-level diffs for audit
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(data)) {
      if (newValue !== undefined) {
        const oldValue = existingOkr[key as keyof typeof existingOkr];
        if (oldValue !== newValue) {
          changedFields[key] = { old: oldValue, new: newValue };
        }
      }
    }

    // Build the update object with only changed fields
    const updateData: Record<string, unknown> = {};
    for (const key of Object.keys(changedFields)) {
      updateData[key] = data[key as keyof typeof data];
    }

    // If nothing changed, return the existing OKR
    if (Object.keys(updateData).length === 0) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ okr: existingOkr }))
      );
    }

    // Recalculate status if progress-related fields changed
    if (existingOkr.due_date) {
      const newProgress = existingOkr.progress;
      const dueDate =
        (updateData.due_date as string) || existingOkr.due_date;
      const newStatus = calculateStatus(
        newProgress,
        existingOkr.created_at,
        dueDate
      );
      if (newStatus !== existingOkr.status) {
        updateData.status = newStatus;
      }
    }

    // Update OKR metadata (only if there are changed fields)
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await serviceClient
        .from("okrs")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        logger.error("OKR update failed", {
          requestId,
          userId: user.id,
          okrId: id,
          error: updateError.message,
        });
        reqLog.finish(500);
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Fehler beim Aktualisieren" },
              { status: 500 }
            )
          )
        );
      }
    }

    // Handle key_results if provided
    const incomingKRs = parsed.data.key_results;
    if (incomingKRs) {
      const existingKRs: Array<{ id: string; sort_order: number }> =
        (existingOkr.key_results || []) as Array<{ id: string; sort_order: number }>;
      const existingKRIds = new Set(existingKRs.map((kr) => kr.id));
      const incomingKRIds = new Set(
        incomingKRs.filter((kr) => kr.id).map((kr) => kr.id!)
      );

      // 1. Delete KRs that were removed
      const toDelete = [...existingKRIds].filter((krId) => !incomingKRIds.has(krId));
      if (toDelete.length > 0) {
        const { error: deleteError } = await serviceClient
          .from("key_results")
          .delete()
          .in("id", toDelete)
          .eq("okr_id", id);

        if (deleteError) {
          logger.error("KR delete failed", {
            requestId,
            userId: user.id,
            okrId: id,
            error: deleteError.message,
          });
        }
      }

      // 2. Update existing KRs
      for (const kr of incomingKRs) {
        if (kr.id && existingKRIds.has(kr.id)) {
          const sortIndex = incomingKRs.indexOf(kr);
          await serviceClient
            .from("key_results")
            .update({
              title: kr.title,
              start_value: kr.start_value,
              target_value: kr.target_value,
              unit: kr.unit || null,
              sort_order: sortIndex,
            })
            .eq("id", kr.id)
            .eq("okr_id", id);
        }
      }

      // 3. Insert new KRs (no id or id not in existing)
      const toInsert = incomingKRs
        .filter((kr) => !kr.id || !existingKRIds.has(kr.id))
        .map((kr, idx) => ({
          okr_id: id,
          title: kr.title,
          start_value: kr.start_value,
          target_value: kr.target_value,
          current_value: kr.start_value,
          unit: kr.unit || null,
          sort_order: existingKRs.length + idx,
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await serviceClient
          .from("key_results")
          .insert(toInsert);

        if (insertError) {
          logger.error("KR insert failed", {
            requestId,
            userId: user.id,
            okrId: id,
            error: insertError.message,
          });
        }
      }
    }

    // Re-fetch the complete OKR with updated key_results
    const { data: updatedOkr } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", id)
      .single();

    // Sort key_results
    if (updatedOkr) {
      updatedOkr.key_results = (updatedOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    if (Object.keys(changedFields).length > 0) {
      logOKRUpdate(
        user.id,
        existingOkr.organization_id,
        id,
        changedFields
      ).catch(() => {});

      logger.audit("okr.updated", {
        requestId,
        userId: user.id,
        okrId: id,
        changedFields: Object.keys(changedFields).join(", "),
      });
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ okr: updatedOkr }))
    );
  } catch (error) {
    logger.error("PATCH /api/okrs/[id] unhandled error", {
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("DELETE", `/api/okrs/${id}`, { requestId });

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

    // Validate UUID format
    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige OKR-ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Fetch the OKR to verify ownership and get details for audit
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

    // Idempotency: if already soft-deleted, return success without re-updating
    if (!existingOkr.is_active) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ success: true }))
      );
    }

    // Soft delete: set is_active = false
    const { error: deleteError } = await serviceClient
      .from("okrs")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("OKR soft-delete failed", {
        requestId,
        userId: user.id,
        okrId: id,
        error: deleteError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Löschen" },
            { status: 500 }
          )
        )
      );
    }

    // Audit log (non-blocking)
    logOKRDelete(
      user.id,
      existingOkr.organization_id,
      id,
      existingOkr.title
    ).catch(() => {});

    logger.audit("okr.deleted", {
      requestId,
      userId: user.id,
      okrId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ success: true }))
    );
  } catch (error) {
    logger.error("DELETE /api/okrs/[id] unhandled error", {
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

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
