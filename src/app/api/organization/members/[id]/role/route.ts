import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["employee", "manager", "hr", "admin"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: memberId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
      ));
    }

    // Prevent self-demotion
    if (memberId === user.id) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Eigene Rolle kann nicht geändert werden" }, { status: 400 })
      ));
    }

    const serviceClient = await createServiceClient();

    // Check requester is admin (self-healing)
    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Profil konnte nicht geladen werden" }, { status: 500 })
      ));
    }
    const { organization_id: orgId, role: userRole } = profileData;

    if (!["admin", "super_admin"].includes(userRole)) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
      ));
    }

    // Validate body
    const body = await request.json();
    const parsed = roleSchema.safeParse(body);
    if (!parsed.success) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Ungültige Rolle" }, { status: 400 })
      ));
    }

    // Check target is in same org
    const { data: targetProfile } = await serviceClient
      .from("profiles")
      .select("organization_id, role")
      .eq("id", memberId)
      .single();

    if (!targetProfile || targetProfile.organization_id !== orgId) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 })
      ));
    }

    // Cannot change super_admin role
    if (targetProfile.role === "super_admin") {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Super-Admin Rolle kann nicht geändert werden" }, { status: 403 })
      ));
    }

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", memberId);

    if (updateError) {
      logger.error("Failed to update member role", { requestId, error: updateError.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
      ));
    }

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ success: true })
    ));
  } catch (error) {
    logger.error("PATCH /api/organization/members/[id]/role error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}
