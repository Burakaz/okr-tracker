import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/career", { requestId });

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

    // Get the user's profile to find organization_id
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      reqLog.finish(200, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ progress: null }))
      );
    }

    const { data: progress, error } = await serviceClient
      .from("user_career_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error) {
      // No career progress record yet is not an error
      if (error.code === "PGRST116") {
        reqLog.finish(200, { userId: user.id });
        return withRateLimitHeaders(
          withCorsHeaders(NextResponse.json({ progress: null }))
        );
      }
      logger.error("Career progress query failed", {
        requestId,
        userId: user.id,
        error: error.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Laden des Karriere-Fortschritts" },
            { status: 500 }
          )
        )
      );
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ progress }))
    );
  } catch (error) {
    logger.error("GET /api/career unhandled error", {
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
