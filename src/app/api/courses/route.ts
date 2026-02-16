import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCourseSchema } from "@/lib/validation";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/courses", { requestId });

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

    // Get user's organization (self-healing)
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
    const { organization_id: orgId } = profileData;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const provider = searchParams.get("provider");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    let query = serviceClient
      .from("courses")
      .select("*, course_modules(id)", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("is_published", true);

    if (category) {
      query = query.eq("category", category);
    }

    if (provider) {
      query = query.eq("provider", provider);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data: courses, error } = await query;

    if (error) {
      logger.error("GET /api/courses query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Kurse" },
            { status: 500 }
          )
        )
      );
    }

    // Map courses to include module_count
    const coursesWithCount = (courses || []).map((course) => ({
      ...course,
      module_count: Array.isArray(course.course_modules)
        ? course.course_modules.length
        : 0,
      course_modules: undefined,
    }));

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ courses: coursesWithCount })
      )
    );
  } catch (error) {
    logger.error("GET /api/courses unhandled error", {
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

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("POST", "/api/courses", { requestId });

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

    const parsed = createCourseSchema.safeParse(body);

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

    // Get user's organization (self-healing)
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
    const { organization_id: orgId } = profileData;

    // Insert the course
    const { data: newCourse, error: insertError } = await serviceClient
      .from("courses")
      .insert({
        organization_id: orgId,
        created_by: user.id,
        title: data.title,
        description: data.description || null,
        provider: data.provider || "Intern",
        category: data.category,
        estimated_duration_minutes: data.estimated_duration_minutes,
        difficulty: data.difficulty || "beginner",
        external_url: data.external_url || null,
        tags: data.tags || [],
        is_published: true,
      })
      .select()
      .single();

    if (insertError || !newCourse) {
      logger.error("Course insert failed", {
        requestId,
        userId: user.id,
        error: insertError?.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen des Kurses" },
            { status: 500 }
          )
        )
      );
    }

    // Bulk insert modules with sort_order = array index
    const modulesToInsert = data.modules.map((mod, index) => ({
      course_id: newCourse.id,
      title: mod.title,
      description: mod.description || null,
      sort_order: index,
      estimated_minutes: mod.estimated_minutes || null,
    }));

    const { data: insertedModules, error: modulesError } = await serviceClient
      .from("course_modules")
      .insert(modulesToInsert)
      .select();

    if (modulesError) {
      logger.error("Course modules insert failed", {
        requestId,
        userId: user.id,
        courseId: newCourse.id,
        error: modulesError.message,
      });
      // Rollback: delete the course if modules fail
      await serviceClient.from("courses").delete().eq("id", newCourse.id);
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen der Module" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("course.created", {
      requestId,
      userId: user.id,
      courseId: newCourse.id,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { course: { ...newCourse, course_modules: insertedModules } },
          { status: 201 }
        )
      )
    );
  } catch (error) {
    logger.error("POST /api/courses unhandled error", {
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
