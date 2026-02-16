import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
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

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine Organisation zugewiesen" }, { status: 404 })
      ));
    }

    // Get all members in org
    const { data: members, error: membersError } = await serviceClient
      .from("profiles")
      .select("id, name, email, role, department, avatar_url, status, created_at")
      .eq("organization_id", profile.organization_id)
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

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({
        members: members || [],
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
