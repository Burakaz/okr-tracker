import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: memberId } = await params;
  const reqLog = logger.request("GET", `/api/team/members/${memberId}/checkins`, { requestId });

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 }))
      );
    }

    const serviceClient = await createServiceClient();

    // Verify requester has manager/HR/admin role in same org
    const { data: requesterProfile } = await serviceClient
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!requesterProfile || !["manager", "hr", "admin", "super_admin"].includes(requesterProfile.role)) {
      reqLog.finish(403);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 }))
      );
    }

    // Verify target member is in same org
    const { data: memberProfile } = await serviceClient
      .from("profiles")
      .select("id, organization_id")
      .eq("id", memberId)
      .single();

    if (!memberProfile || memberProfile.organization_id !== requesterProfile.organization_id) {
      reqLog.finish(404);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 }))
      );
    }

    // Optional OKR filter
    const okrId = request.nextUrl.searchParams.get("okr_id");

    let query = serviceClient
      .from("okr_checkins")
      .select("*")
      .eq("user_id", memberId)
      .order("checked_at", { ascending: false })
      .limit(50);

    if (okrId) {
      query = query.eq("okr_id", okrId);
    }

    const { data: checkins, error } = await query;

    if (error) {
      logger.error("Team member checkins query failed", { requestId, error: error.message });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Fehler beim Laden der Check-ins" }, { status: 500 }))
      );
    }

    reqLog.finish(200, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ checkins: checkins || [] }))
    );
  } catch (error) {
    logger.error("GET team member checkins error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 }))
    );
  }
}
