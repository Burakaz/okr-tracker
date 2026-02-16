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

    const { data: members, error: membersError } = await serviceClient
      .from("profiles")
      .select("id, name, email, role, department, avatar_url, status, created_at")
      .eq("organization_id", orgId)
      .order("name");

    if (membersError) {
      logger.error("Failed to fetch members", { requestId, error: membersError.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Fehler beim Laden der Mitglieder" }, { status: 500 })
      ));
    }

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ members: members || [] })
    ));
  } catch (error) {
    logger.error("GET /api/organization/members error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}
