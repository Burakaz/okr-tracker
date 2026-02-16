import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateEnrollmentSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("PATCH", `/api/enrollments/${id}`, { requestId });

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

    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige Einschreibungs-ID" }, { status: 400 })
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

    const parsed = updateEnrollmentSchema.safeParse(body);

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

    // Verify ownership: only own enrollments
    const { data: existingEnrollment, error: fetchError } = await serviceClient
      .from("enrollments")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingEnrollment) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Einschreibung nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (Object.keys(updateData).length === 0) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ enrollment: existingEnrollment }))
      );
    }

    const { data: updatedEnrollment, error: updateError } = await serviceClient
      .from("enrollments")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      logger.error("Enrollment update failed", {
        requestId,
        userId: user.id,
        enrollmentId: id,
        error: updateError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Aktualisieren der Einschreibung" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("enrollment.updated", {
      requestId,
      userId: user.id,
      enrollmentId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ enrollment: updatedEnrollment }))
    );
  } catch (error) {
    logger.error("PATCH /api/enrollments/[id] unhandled error", {
      requestId,
      enrollmentId: id,
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
  const reqLog = logger.request("DELETE", `/api/enrollments/${id}`, { requestId });

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

    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige Einschreibungs-ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Verify ownership
    const { data: existingEnrollment, error: fetchError } = await serviceClient
      .from("enrollments")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingEnrollment) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Einschreibung nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Delete module_completions first (cascade)
    await serviceClient
      .from("module_completions")
      .delete()
      .eq("enrollment_id", id);

    // Delete certificates
    await serviceClient
      .from("certificates")
      .delete()
      .eq("enrollment_id", id);

    // Delete the enrollment
    const { error: deleteError } = await serviceClient
      .from("enrollments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Enrollment delete failed", {
        requestId,
        userId: user.id,
        enrollmentId: id,
        error: deleteError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Abmelden" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("enrollment.deleted", {
      requestId,
      userId: user.id,
      enrollmentId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ success: true }))
    );
  } catch (error) {
    logger.error("DELETE /api/enrollments/[id] unhandled error", {
      requestId,
      enrollmentId: id,
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
