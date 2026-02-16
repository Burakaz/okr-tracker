import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateCourseSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("GET", `/api/courses/${id}`, { requestId });

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
          NextResponse.json({ error: "Ungültige Kurs-ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Fetch course with modules ordered by sort_order
    const { data: course, error } = await serviceClient
      .from("courses")
      .select("*, course_modules(*)")
      .eq("id", id)
      .single();

    if (error || !course) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Kurs nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Sort modules by sort_order
    course.course_modules = (course.course_modules || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );

    // Check if current user has an enrollment
    const { data: enrollment } = await serviceClient
      .from("enrollments")
      .select("*")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ course, enrollment: enrollment || null })
      )
    );
  } catch (error) {
    logger.error("GET /api/courses/[id] unhandled error", {
      requestId,
      courseId: id,
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
  const reqLog = logger.request("PATCH", `/api/courses/${id}`, { requestId });

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
          NextResponse.json({ error: "Ungültige Kurs-ID" }, { status: 400 })
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

    const parsed = updateCourseSchema.safeParse(body);

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

    // Fetch course to check ownership
    const { data: existingCourse, error: fetchError } = await serviceClient
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingCourse) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Kurs nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Check permission: only owner or admin/super_admin
    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      reqLog.finish(500, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Profil konnte nicht geladen werden" },
            { status: 500 }
          )
        )
      );
    }
    const { role: userRole } = profileData;

    const isOwner = existingCourse.created_by === user.id;
    const isAdmin = userRole === "admin" || userRole === "super_admin";

    if (!isOwner && !isAdmin) {
      reqLog.finish(403, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Berechtigung zum Bearbeiten dieses Kurses" },
            { status: 403 }
          )
        )
      );
    }

    // Build update object with only defined fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ course: existingCourse }))
      );
    }

    const { data: updatedCourse, error: updateError } = await serviceClient
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select("*, course_modules(*)")
      .single();

    if (updateError) {
      logger.error("Course update failed", {
        requestId,
        userId: user.id,
        courseId: id,
        error: updateError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Aktualisieren des Kurses" },
            { status: 500 }
          )
        )
      );
    }

    // Sort modules
    if (updatedCourse) {
      updatedCourse.course_modules = (updatedCourse.course_modules || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    logger.audit("course.updated", {
      requestId,
      userId: user.id,
      courseId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ course: updatedCourse }))
    );
  } catch (error) {
    logger.error("PATCH /api/courses/[id] unhandled error", {
      requestId,
      courseId: id,
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
  const reqLog = logger.request("DELETE", `/api/courses/${id}`, { requestId });

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
          NextResponse.json({ error: "Ungültige Kurs-ID" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Fetch course to check ownership
    const { data: existingCourse, error: fetchError } = await serviceClient
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingCourse) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Kurs nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Check permission: only owner or admin/super_admin
    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      reqLog.finish(500, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Profil konnte nicht geladen werden" },
            { status: 500 }
          )
        )
      );
    }
    const { role: userRole } = profileData;

    const isOwner = existingCourse.created_by === user.id;
    const isAdmin = userRole === "admin" || userRole === "super_admin";

    if (!isOwner && !isAdmin) {
      reqLog.finish(403, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Berechtigung zum Löschen dieses Kurses" },
            { status: 403 }
          )
        )
      );
    }

    // Check for active enrollments
    const { count: activeEnrollments, error: countError } = await serviceClient
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id)
      .in("status", ["in_progress", "completed"]);

    if (countError) {
      logger.error("Enrollment count check failed", {
        requestId,
        userId: user.id,
        courseId: id,
        error: countError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Prüfen der Einschreibungen" },
            { status: 500 }
          )
        )
      );
    }

    if ((activeEnrollments || 0) > 0) {
      reqLog.finish(409, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Kurs kann nicht gelöscht werden, da aktive Einschreibungen existieren",
            },
            { status: 409 }
          )
        )
      );
    }

    // Delete the course (cascades to modules)
    const { error: deleteError } = await serviceClient
      .from("courses")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("Course delete failed", {
        requestId,
        userId: user.id,
        courseId: id,
        error: deleteError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Löschen des Kurses" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("course.deleted", {
      requestId,
      userId: user.id,
      courseId: id,
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ success: true }))
    );
  } catch (error) {
    logger.error("DELETE /api/courses/[id] unhandled error", {
      requestId,
      courseId: id,
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
