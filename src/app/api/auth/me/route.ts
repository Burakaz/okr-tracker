import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/auth/me", { requestId });

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    const serviceClient = await createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      logger.warn("Profile not found for authenticated user", {
        requestId,
        userId: authUser.id,
      });
      reqLog.finish(404, { userId: authUser.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Profil nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    const user = {
      id: profile.id,
      email: profile.email || authUser.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      department: profile.department,
      manager_id: profile.manager_id,
      career_level_id: profile.career_level_id,
      organization_id: profile.organization_id,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    reqLog.finish(200, { userId: authUser.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ user }))
    );
  } catch (error) {
    logger.error("GET /api/auth/me unhandled error", {
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
