import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
}

function getQuarterDateRange(quarter: string): { start: string; end: string } {
  const match = quarter.match(/^Q([1-4]) (\d{4})$/);
  if (!match) throw new Error("Invalid quarter");
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(year, startMonth, 1).toISOString();
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59).toISOString();
  return { start, end };
}

const VALID_EVENTS = ["okr_created", "checkin_created", "course_completed", "quarter_ended"] as const;
type AchievementEvent = (typeof VALID_EVENTS)[number];

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("POST", "/api/achievements/check", { requestId });

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

    const { event } = body as { event?: string };
    if (!event || !VALID_EVENTS.includes(event as AchievementEvent)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültiges Event. Erlaubt: " + VALID_EVENTS.join(", ") },
            { status: 400 }
          )
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

    const newlyAwarded: Array<{ type: string; earned_at: string }> = [];

    // Helper to upsert an achievement (no-op if already exists)
    async function awardAchievement(type: string) {
      const { data, error } = await serviceClient
        .from("achievements")
        .upsert(
          {
            user_id: user!.id,
            organization_id: orgId,
            type,
            earned_at: new Date().toISOString(),
            metadata: {},
          },
          { onConflict: "user_id,type" }
        )
        .select()
        .single();

      if (!error && data) {
        newlyAwarded.push({ type: data.type, earned_at: data.earned_at });
      }
    }

    if (event === "okr_created") {
      // Check if user has >= 1 OKR
      const { count } = await serviceClient
        .from("okrs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count >= 1) {
        await awardAchievement("first_okr");
      }
    }

    if (event === "checkin_created") {
      // Check if user has >= 1 check-in
      const { count } = await serviceClient
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count >= 1) {
        await awardAchievement("first_checkin");
      }
    }

    if (event === "course_completed") {
      // Check if user has >= 1 completed enrollment
      const { count: completedCount } = await serviceClient
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (completedCount && completedCount >= 1) {
        await awardAchievement("first_course_completed");
      }

      // Check if >= 3 completed in current quarter
      const currentQuarter = getCurrentQuarter();
      const quarterRange = getQuarterDateRange(currentQuarter);

      const { count: quarterCompletedCount } = await serviceClient
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("started_at", quarterRange.start)
        .lte("started_at", quarterRange.end);

      if (quarterCompletedCount && quarterCompletedCount >= 3) {
        await awardAchievement("learning_machine");
      }
    }

    if (event === "quarter_ended") {
      const currentQuarter = getCurrentQuarter();

      // Fetch all OKRs for the current quarter
      const { data: okrs } = await serviceClient
        .from("okrs")
        .select("progress")
        .eq("user_id", user.id)
        .eq("quarter", currentQuarter);

      const okrList = okrs || [];

      if (okrList.length > 0) {
        // Check avg progress >= 80% → award "quarter_hero"
        const avgProgress =
          okrList.reduce((sum, o) => sum + o.progress, 0) / okrList.length;

        if (avgProgress >= 80) {
          await awardAchievement("quarter_hero");
        }

        // Check all OKRs >= 70% → award "all_completed"
        const allAbove70 = okrList.every((o) => o.progress >= 70);
        if (allAbove70) {
          await awardAchievement("all_completed");
        }
      }
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ achievements: newlyAwarded })
      )
    );
  } catch (error) {
    logger.error("POST /api/achievements/check unhandled error", {
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
