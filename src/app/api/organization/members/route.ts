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
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine Organisation zugewiesen" }, { status: 404 })
      ));
    }

    const { data: members, error: membersError } = await serviceClient
      .from("profiles")
      .select("id, name, email, role, department, avatar_url, status, created_at")
      .eq("organization_id", profile.organization_id)
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
