import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/audit", { requestId });

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

    // Get the user's profile to check role and organization
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      100
    );
    const resourceType = searchParams.get("resource_type");
    const action = searchParams.get("action");
    const offset = (page - 1) * limit;

    // Build query -- regular users see only their own logs,
    // managers/hr/admin/super_admin see all org logs
    const isPrivileged = ["manager", "hr", "admin", "super_admin"].includes(
      profile.role
    );

    let query = serviceClient
      .from("okr_audit_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-privileged users only see their own logs
    if (!isPrivileged) {
      query = query.eq("user_id", user.id);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    if (action) {
      query = query.eq("action", action);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      logger.error("Audit logs query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden der Audit-Logs" },
            { status: 500 }
          )
        )
      );
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({
          logs: logs || [],
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
    logger.error("GET /api/audit unhandled error", {
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
