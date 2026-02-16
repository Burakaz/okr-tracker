import { NextRequest, NextResponse } from "next/server";
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

    // Get user's profile to find org
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

    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    if (orgError || !org) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Organisation nicht gefunden" }, { status: 404 })
      ));
    }

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ organization: org })
    ));
  } catch (error) {
    logger.error("GET /api/organization error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}

export async function PATCH(request: NextRequest) {
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

    // Check user is admin
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

    if (!["admin", "super_admin"].includes(profile.role)) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
      ));
    }

    const body = await request.json();
    const allowedFields = ["name", "domain", "logo_url"];
    const updates: Record<string, string> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine gültigen Felder" }, { status: 400 })
      ));
    }

    const { data: org, error: updateError } = await serviceClient
      .from("organizations")
      .update(updates)
      .eq("id", profile.organization_id)
      .select("*")
      .single();

    if (updateError || !org) {
      logger.error("Failed to update organization", { requestId, error: updateError?.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
      ));
    }

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ organization: org })
    ));
  } catch (error) {
    logger.error("PATCH /api/organization error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}
