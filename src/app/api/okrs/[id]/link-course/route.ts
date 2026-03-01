import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { linkCourseSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: okrId } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${okrId}/link-course`, { requestId });

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

    const parsed = linkCourseSchema.safeParse(body);

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

    // Verify the key_result belongs to an OKR owned by the user
    const { data: keyResult, error: krError } = await serviceClient
      .from("key_results")
      .select("id, okr_id")
      .eq("id", data.key_result_id)
      .eq("okr_id", okrId)
      .single();

    if (krError || !keyResult) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Key Result nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Verify the OKR belongs to the user
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

    // Verify the enrollment belongs to the user
    const { data: enrollment, error: enrollError } = await serviceClient
      .from("enrollments")
      .select("id, user_id")
      .eq("id", data.enrollment_id)
      .eq("user_id", user.id)
      .single();

    if (enrollError || !enrollment) {
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

    // Insert into okr_course_links (upsert on conflict)
    const { data: link, error: linkError } = await serviceClient
      .from("okr_course_links")
      .upsert(
        {
          key_result_id: data.key_result_id,
          enrollment_id: data.enrollment_id,
          auto_update: data.auto_update ?? true,
        },
        { onConflict: "key_result_id,enrollment_id" }
      )
      .select()
      .single();

    if (linkError || !link) {
      logger.error("Course link upsert failed", {
        requestId,
        userId: user.id,
        okrId,
        keyResultId: data.key_result_id,
        enrollmentId: data.enrollment_id,
        error: linkError?.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Verknüpfen des Kurses" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("course-link.created", {
      requestId,
      userId: user.id,
      okrId,
      keyResultId: data.key_result_id,
      enrollmentId: data.enrollment_id,
      linkId: link.id,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { link },
          { status: 201 }
        )
      )
    );
  } catch (error) {
    logger.error("POST /api/okrs/[id]/link-course unhandled error", {
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
