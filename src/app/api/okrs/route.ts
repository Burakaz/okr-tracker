import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createOKRSchema } from "@/lib/validation";
import { logOKRCreate } from "@/lib/audit";
import { getQuarterDateRange, MAX_OKRS_PER_QUARTER } from "@/lib/okr-logic";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/okrs", { requestId });

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
    const quarter = searchParams.get("quarter");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const scope = searchParams.get("scope");
    const showArchived = searchParams.get("archived") === "true";
    const focusOnly = searchParams.get("focus") === "true";
    const sortBy = searchParams.get("sort_by") || "sort_order";
    const sortDir = searchParams.get("sort_dir") || "asc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      100
    );
    const offset = (page - 1) * limit;

    const serviceClient = await createServiceClient();

    // Build the count query and data query in parallel
    let query = serviceClient
      .from("okrs")
      .select("*, key_results(*)", { count: "exact" })
      .eq("user_id", user.id);

    // By default, only show active OKRs unless archived=true
    if (!showArchived) {
      query = query.eq("is_active", true);
    }

    if (quarter) {
      query = query.eq("quarter", quarter);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (scope) {
      query = query.eq("scope", scope);
    }

    if (focusOnly) {
      query = query.eq("is_focus", true);
    }

    // Sorting
    const ascending = sortDir === "asc";
    if (sortBy === "created_at") {
      query = query.order("created_at", { ascending });
    } else if (sortBy === "progress") {
      query = query.order("progress", { ascending });
    } else if (sortBy === "due_date") {
      query = query.order("due_date", { ascending });
    } else if (sortBy === "title") {
      query = query.order("title", { ascending });
    } else {
      // Default: sort_order asc, then created_at desc
      query = query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: okrs, error, count } = await query;

    if (error) {
      logger.error("GET /api/okrs query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der OKRs" },
            { status: 500 }
          )
        )
      );
    }

    // Sort key_results by sort_order within each OKR
    const sortedOkrs = (okrs || []).map((okr) => ({
      ...okr,
      key_results: (okr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    }));

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({
          okrs: sortedOkrs,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        })
      )
    );
  } catch (error) {
    logger.error("GET /api/okrs unhandled error", {
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
  const reqLog = logger.request("POST", "/api/okrs", { requestId });

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

    const parsed = createOKRSchema.safeParse(body);

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

    // Get the user's profile to find organization_id
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
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

    const orgId = profile.organization_id;

    if (!orgId) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Organisation zugewiesen" },
            { status: 400 }
          )
        )
      );
    }

    // Enforce MAX_OKRS_PER_QUARTER limit
    const { count, error: countError } = await serviceClient
      .from("okrs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("quarter", data.quarter)
      .eq("is_active", true);

    if (countError) {
      logger.error("OKR count check failed", {
        requestId,
        userId: user.id,
        error: countError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Prüfen des OKR-Limits" },
            { status: 500 }
          )
        )
      );
    }

    if ((count || 0) >= MAX_OKRS_PER_QUARTER) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error: `Maximal ${MAX_OKRS_PER_QUARTER} OKRs pro Quartal erlaubt`,
            },
            { status: 400 }
          )
        )
      );
    }

    // Calculate due_date from quarter end if not provided
    let dueDate = data.due_date || null;
    if (!dueDate) {
      const { end } = getQuarterDateRange(data.quarter);
      dueDate = end.toISOString().split("T")[0];
    }

    // Get next sort_order
    const { data: lastOkr } = await serviceClient
      .from("okrs")
      .select("sort_order")
      .eq("user_id", user.id)
      .eq("quarter", data.quarter)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastOkr?.sort_order ?? -1) + 1;

    // Create the OKR
    const { data: newOkr, error: insertError } = await serviceClient
      .from("okrs")
      .insert({
        user_id: user.id,
        organization_id: orgId,
        title: data.title,
        why_it_matters: data.why_it_matters || null,
        quarter: data.quarter,
        category: data.category,
        scope: data.scope,
        due_date: dueDate,
        team_id: data.team_id || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError || !newOkr) {
      logger.error("OKR insert failed", {
        requestId,
        userId: user.id,
        error: insertError?.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen des OKR" },
            { status: 500 }
          )
        )
      );
    }

    // Create key results
    const keyResultsToInsert = data.key_results.map((kr, index) => ({
      okr_id: newOkr.id,
      title: kr.title,
      start_value: kr.start_value,
      target_value: kr.target_value,
      current_value: kr.start_value,
      unit: kr.unit || null,
      sort_order: index,
    }));

    const { data: insertedKRs, error: krError } = await serviceClient
      .from("key_results")
      .insert(keyResultsToInsert)
      .select();

    if (krError) {
      logger.error("Key results insert failed", {
        requestId,
        userId: user.id,
        okrId: newOkr.id,
        error: krError.message,
      });
      // Rollback: delete the OKR if key results fail
      await serviceClient.from("okrs").delete().eq("id", newOkr.id);
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Erstellen der Key Results" },
            { status: 500 }
          )
        )
      );
    }

    // Audit log (non-blocking)
    logOKRCreate(user.id, orgId, newOkr.id, data.title).catch(() => {});

    logger.audit("okr.created", {
      requestId,
      userId: user.id,
      okrId: newOkr.id,
      quarter: data.quarter,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { okr: { ...newOkr, key_results: insertedKRs } },
          { status: 201 }
        )
      )
    );
  } catch (error) {
    logger.error("POST /api/okrs unhandled error", {
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
