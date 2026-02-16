import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { enrollCourseSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("POST", `/api/courses/${id}/enroll`, { requestId });

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

    // Parse optional body (notes)
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for enrollment
    }

    const parsed = enrollCourseSchema.safeParse(body);
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

    // Get user's organization_id from profile
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Profil nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Verify course exists
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .select("id")
      .eq("id", id)
      .single();

    if (courseError || !course) {
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

    // Create enrollment
    const { data: enrollment, error: insertError } = await serviceClient
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id: id,
        organization_id: profile.organization_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
        notes: data.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      // Check for UNIQUE constraint violation (user already enrolled)
      if (insertError.code === "23505") {
        reqLog.finish(409, { userId: user.id });
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Sie sind bereits in diesen Kurs eingeschrieben" },
              { status: 409 }
            )
          )
        );
      }

      logger.error("Enrollment insert failed", {
        requestId,
        userId: user.id,
        courseId: id,
        error: insertError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Einschreiben" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("enrollment.created", {
      requestId,
      userId: user.id,
      courseId: id,
      enrollmentId: enrollment.id,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ enrollment }, { status: 201 })
      )
    );
  } catch (error) {
    logger.error("POST /api/courses/[id]/enroll unhandled error", {
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
