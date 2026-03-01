import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

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

function getPreviousQuarter(): string {
  const now = new Date();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  if (currentQ === 1) return `Q4 ${currentYear - 1}`;
  return `Q${currentQ - 1} ${currentYear}`;
}

function getLast4Quarters(fromQuarter: string): string[] {
  const quarters: string[] = [];
  let current = fromQuarter;
  for (let i = 0; i < 4; i++) {
    quarters.push(current);
    const match = current.match(/^Q([1-4]) (\d{4})$/);
    if (!match) break;
    const q = parseInt(match[1]);
    const year = parseInt(match[2]);
    if (q === 1) {
      current = `Q4 ${year - 1}`;
    } else {
      current = `Q${q - 1} ${year}`;
    }
  }
  return quarters.reverse();
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/review", { requestId });

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

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter") || getPreviousQuarter();

    // Validate quarter format
    if (!/^Q[1-4] \d{4}$/.test(quarter)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültiges Quartal-Format (z.B. Q1 2026)" },
            { status: 400 }
          )
        )
      );
    }

    // 1. Fetch all OKRs for the user in that quarter (with key_results)
    const { data: okrs, error: okrError } = await serviceClient
      .from("okrs")
      .select("id, title, category, progress, status, key_results(id)")
      .eq("user_id", user.id)
      .eq("quarter", quarter);

    if (okrError) {
      logger.error("GET /api/review OKR query failed", {
        requestId,
        userId: user.id,
        error: okrError.message,
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

    // 2. Calculate avg progress as score
    const okrList = okrs || [];
    const score =
      okrList.length > 0
        ? Math.round(
            okrList.reduce((sum, okr) => sum + okr.progress, 0) / okrList.length
          )
        : 0;

    // 3. Map OKRs with key_results_count
    const reviewOkrs = okrList.map((okr) => ({
      id: okr.id,
      title: okr.title,
      category: okr.category,
      progress: okr.progress,
      status: okr.status,
      key_results_count: Array.isArray(okr.key_results)
        ? okr.key_results.length
        : 0,
    }));

    // 4. Fetch enrollments for that quarter range
    let quarterRange: { start: string; end: string };
    try {
      quarterRange = getQuarterDateRange(quarter);
    } catch {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültiges Quartal-Format" },
            { status: 400 }
          )
        )
      );
    }

    const { data: enrollments } = await serviceClient
      .from("enrollments")
      .select("id, status, certificates(id)")
      .eq("user_id", user.id)
      .gte("started_at", quarterRange.start)
      .lte("started_at", quarterRange.end);

    const enrollmentList = enrollments || [];
    const coursesEnrolled = enrollmentList.length;
    const coursesCompleted = enrollmentList.filter(
      (e) => e.status === "completed"
    ).length;
    const certificatesEarned = enrollmentList.reduce(
      (sum, e) =>
        sum + (Array.isArray(e.certificates) ? e.certificates.length : 0),
      0
    );

    // 5. Fetch achievements for the user
    const { data: achievements } = await serviceClient
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    // 6. Fetch historical scores: for each of the last 4 quarters, get avg progress
    const last4Quarters = getLast4Quarters(quarter);
    const trend: Array<{ quarter: string; score: number }> = [];

    for (const q of last4Quarters) {
      const { data: qOkrs } = await serviceClient
        .from("okrs")
        .select("progress")
        .eq("user_id", user.id)
        .eq("quarter", q);

      const qList = qOkrs || [];
      const qScore =
        qList.length > 0
          ? Math.round(
              qList.reduce((sum, o) => sum + o.progress, 0) / qList.length
            )
          : 0;

      trend.push({ quarter: q, score: qScore });
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({
          review: {
            quarter,
            score,
            okrs: reviewOkrs,
            learning_summary: {
              courses_enrolled: coursesEnrolled,
              courses_completed: coursesCompleted,
              certificates_earned: certificatesEarned,
            },
            achievements: achievements || [],
            trend,
          },
        })
      )
    );
  } catch (error) {
    logger.error("GET /api/review unhandled error", {
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
