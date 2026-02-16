import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const requestId = generateRequestId();
  const { id, moduleId } = await params;
  const reqLog = logger.request(
    "POST",
    `/api/courses/${id}/modules/${moduleId}/complete`,
    { requestId }
  );

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

    if (!isValidUUID(id) || !isValidUUID(moduleId)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Ungültige ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Find user's enrollment for this course
    const { data: enrollment, error: enrollmentError } = await serviceClient
      .from("enrollments")
      .select("id, status")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .single();

    if (enrollmentError || !enrollment) {
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

    // Check if module_completion already exists
    const { data: existing } = await serviceClient
      .from("module_completions")
      .select("id")
      .eq("enrollment_id", enrollment.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    let completed: boolean;

    if (existing) {
      // Toggle OFF: delete the completion
      const { error: deleteError } = await serviceClient
        .from("module_completions")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        logger.error("Module completion delete failed", {
          requestId,
          userId: user.id,
          moduleId,
          error: deleteError.message,
        });
        reqLog.finish(500);
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Fehler beim Entfernen der Modulabschluss-Markierung" },
              { status: 500 }
            )
          )
        );
      }
      completed = false;
    } else {
      // Toggle ON: insert the completion
      const { error: insertError } = await serviceClient
        .from("module_completions")
        .insert({
          enrollment_id: enrollment.id,
          module_id: moduleId,
          completed_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error("Module completion insert failed", {
          requestId,
          userId: user.id,
          moduleId,
          error: insertError.message,
        });
        reqLog.finish(500);
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Fehler beim Markieren des Moduls als abgeschlossen" },
              { status: 500 }
            )
          )
        );
      }
      completed = true;
    }

    // Count completions vs total modules
    const { count: completionCount } = await serviceClient
      .from("module_completions")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_id", enrollment.id);

    const { count: totalModules } = await serviceClient
      .from("course_modules")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id);

    const completions = completionCount || 0;
    const total = totalModules || 1;
    const progress = Math.round((completions / total) * 100);

    // Update enrollment status based on completions
    let enrollmentStatus = enrollment.status;

    if (completions >= total) {
      // All modules completed
      enrollmentStatus = "completed";
      await serviceClient
        .from("enrollments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", enrollment.id);
    } else if (enrollment.status === "completed") {
      // Was completed but now a module was un-completed
      enrollmentStatus = "in_progress";
      await serviceClient
        .from("enrollments")
        .update({
          status: "in_progress",
          completed_at: null,
        })
        .eq("id", enrollment.id);
    }

    logger.audit("module.completion_toggled", {
      requestId,
      userId: user.id,
      courseId: id,
      moduleId,
      completed: String(completed),
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({
          completed,
          progress,
          enrollment_status: enrollmentStatus,
        })
      )
    );
  } catch (error) {
    logger.error(
      "POST /api/courses/[id]/modules/[moduleId]/complete unhandled error",
      {
        requestId,
        courseId: id,
        moduleId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
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
