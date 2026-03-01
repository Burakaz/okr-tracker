import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/achievements", { requestId });

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

    const { data: achievements } = await serviceClient
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ achievements: achievements || [] })
      )
    );
  } catch (error) {
    logger.error("GET /api/achievements unhandled error", {
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
