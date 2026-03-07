import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
      ));
    }

    const serviceClient = await createServiceClient();

    // Get user's organization (self-healing)
    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Profil konnte nicht geladen werden" }, { status: 500 })
      ));
    }
    const { organization_id: orgId } = profileData;

    // Get all members in org
    const { data: members, error: membersError } = await serviceClient
      .from("profiles")
      .select("id, name, email, role, department, avatar_url, status, position, craft_focus, career_level_id, created_at")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("name");

    if (membersError) {
      logger.error("Failed to fetch team members", { requestId, error: membersError.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
      ));
    }

    // Get OKR stats for the team
    const memberIds = (members || []).map((m: { id: string }) => m.id);

    let teamOKRs: Array<{ id: string; user_id: string; progress: number; status: string; is_active: boolean }> = [];
    if (memberIds.length > 0) {
      const { data: okrs } = await serviceClient
        .from("okrs")
        .select("id, user_id, progress, status, is_active")
        .in("user_id", memberIds)
        .eq("is_active", true);
      teamOKRs = okrs || [];
    }

    const totalOKRs = teamOKRs.length;
    const avgProgress = totalOKRs > 0
      ? Math.round(teamOKRs.reduce((sum: number, o: { progress: number }) => sum + o.progress, 0) / totalOKRs)
      : 0;
    const atRiskCount = teamOKRs.filter((o: { status: string }) => o.status === "at_risk" || o.status === "off_track").length;

    // P2-FIX: Single-pass reduce instead of O(N²) filter-per-member
    const memberOKRAccum: Record<string, { count: number; totalProgress: number }> = {};
    for (const okr of teamOKRs) {
      if (!memberOKRAccum[okr.user_id]) {
        memberOKRAccum[okr.user_id] = { count: 0, totalProgress: 0 };
      }
      memberOKRAccum[okr.user_id].count++;
      memberOKRAccum[okr.user_id].totalProgress += okr.progress;
    }
    const memberOKRStats: Record<string, { count: number; avgProgress: number }> = {};
    for (const [userId, accum] of Object.entries(memberOKRAccum)) {
      memberOKRStats[userId] = {
        count: accum.count,
        avgProgress: Math.round(accum.totalProgress / accum.count),
      };
    }

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({
        members: members || [],
        memberOKRStats,
        stats: {
          totalMembers: (members || []).length,
          totalOKRs,
          avgProgress,
          atRiskCount,
        },
      })
    ));
  } catch (error) {
    logger.error("GET /api/team error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}
