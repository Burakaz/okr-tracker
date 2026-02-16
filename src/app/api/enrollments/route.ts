import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/enrollments", { requestId });

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const serviceClient = await createServiceClient();

    // Fetch enrollments with course, modules, module_completions, and certificates
    let query = serviceClient
      .from("enrollments")
      .select(
        "*, course:courses(*, modules:course_modules(*)), module_completions(*), certificates(*)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      logger.error("GET /api/enrollments query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Einschreibungen" },
            { status: 500 }
          )
        )
      );
    }

    // Calculate progress for each enrollment
    const enrichedEnrollments = (enrollments || []).map((enrollment) => {
      const moduleCount = enrollment.course?.modules?.length || 0;
      const completionCount = enrollment.module_completions?.length || 0;
      const progress =
        moduleCount > 0
          ? Math.round((completionCount / moduleCount) * 100)
          : 0;

      return {
        ...enrollment,
        progress,
      };
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ enrollments: enrichedEnrollments })
      )
    );
  } catch (error) {
    logger.error("GET /api/enrollments unhandled error", {
      requestId,
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
