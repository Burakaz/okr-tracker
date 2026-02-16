import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/team/learnings", { requestId });

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

    // Get user's profile with role and org (self-healing)
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
    const { organization_id: orgId, role: userRole } = profileData;

    // Check permission: manager, hr, admin, or super_admin only
    const allowedRoles = ["manager", "hr", "admin", "super_admin"];
    if (!allowedRoles.includes(userRole)) {
      reqLog.finish(403, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Berechtigung für diese Ansicht" },
            { status: 403 }
          )
        )
      );
    }

    // Get all profiles in same org
    const { data: members, error: membersError } = await serviceClient
      .from("profiles")
      .select("id, name, email, role, department, avatar_url")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("name");

    if (membersError) {
      logger.error("Failed to fetch team members", {
        requestId,
        error: membersError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Teammitglieder" },
            { status: 500 }
          )
        )
      );
    }

    if (!members || members.length === 0) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ members: [] }))
      );
    }

    const memberIds = members.map((m) => m.id);

    // Fetch all enrollments for org members
    const { data: enrollments } = await serviceClient
      .from("enrollments")
      .select("id, user_id, status, course:courses(id, course_modules(id))")
      .in("user_id", memberIds);

    // Fetch all module_completions for these enrollments
    const enrollmentIds = (enrollments || []).map((e) => e.id);
    let allCompletions: Array<{ enrollment_id: string }> = [];
    if (enrollmentIds.length > 0) {
      const { data: completions } = await serviceClient
        .from("module_completions")
        .select("enrollment_id")
        .in("enrollment_id", enrollmentIds);
      allCompletions = completions || [];
    }

    // Build stats per member
    const memberStats = members.map((member) => {
      const memberEnrollments = (enrollments || []).filter(
        (e) => e.user_id === member.id
      );

      const totalEnrollments = memberEnrollments.length;
      const completedEnrollments = memberEnrollments.filter(
        (e) => e.status === "completed"
      ).length;
      const inProgressEnrollments = memberEnrollments.filter(
        (e) => e.status === "in_progress"
      ).length;

      // Count total modules across all enrollments
      let totalModules = 0;
      for (const enrollment of memberEnrollments) {
        const courseData = enrollment.course as unknown as { id: string; course_modules: Array<{ id: string }> } | null;
        const modules = courseData?.course_modules;
        totalModules += modules?.length || 0;
      }

      // Count completed modules
      const memberEnrollmentIds = memberEnrollments.map((e) => e.id);
      const completedModules = allCompletions.filter((c) =>
        memberEnrollmentIds.includes(c.enrollment_id)
      ).length;

      return {
        ...member,
        total_enrollments: totalEnrollments,
        completed_enrollments: completedEnrollments,
        in_progress_enrollments: inProgressEnrollments,
        total_modules: totalModules,
        completed_modules: completedModules,
      };
    });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ members: memberStats }))
    );
  } catch (error) {
    logger.error("GET /api/team/learnings unhandled error", {
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
