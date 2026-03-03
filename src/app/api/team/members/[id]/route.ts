import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders, ensureProfileWithOrg } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";
import { z } from "zod";

const updateMemberSchema = z.object({
  position: z.string().max(100).optional(),
  craft_focus: z.string().max(100).optional(),
  career_level_id: z.string().uuid().nullable().optional(),
  department: z.string().max(100).optional(),
});

// Helper: check if requester can view/edit this member
async function checkAccess(
  serviceClient: ReturnType<typeof createServiceClient> extends Promise<infer T> ? T : never,
  requesterId: string,
  requesterOrgId: string,
  requesterRole: string,
  memberId: string,
  requireEdit: boolean
): Promise<{ allowed: boolean; error?: string; status?: number }> {
  const allowedRoles = requireEdit
    ? ["manager", "hr", "admin", "super_admin"]
    : ["manager", "hr", "admin", "super_admin"];

  if (!allowedRoles.includes(requesterRole)) {
    return { allowed: false, error: "Keine Berechtigung", status: 403 };
  }

  // Check target is in same org
  const { data: targetProfile } = await serviceClient
    .from("profiles")
    .select("organization_id, manager_id")
    .eq("id", memberId)
    .single();

  if (!targetProfile || targetProfile.organization_id !== requesterOrgId) {
    return { allowed: false, error: "Mitglied nicht gefunden", status: 404 };
  }

  // For edit: managers can only edit direct reports
  if (requireEdit && requesterRole === "manager") {
    if (targetProfile.manager_id !== requesterId) {
      return { allowed: false, error: "Nur direkte Mitarbeiter können bearbeitet werden", status: 403 };
    }
  }

  return { allowed: true };
}

export async function GET(
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

    const serviceClient = await createServiceClient();

    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Profil konnte nicht geladen werden" }, { status: 500 })
      ));
    }
    const { organization_id: orgId, role: userRole } = profileData;

    // Check view access
    const access = await checkAccess(serviceClient, user.id, orgId, userRole, memberId, false);
    if (!access.allowed) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: access.error }, { status: access.status })
      ));
    }

    // Fetch all data in parallel
    const [profileRes, okrsRes, enrollmentsRes, careerProgressRes] = await Promise.all([
      // Profile with full fields
      serviceClient
        .from("profiles")
        .select("id, name, email, avatar_url, role, department, status, position, craft_focus, career_level_id, manager_id, created_at")
        .eq("id", memberId)
        .single(),

      // Active OKRs with key results
      serviceClient
        .from("okrs")
        .select("id, title, category, progress, status, confidence, quarter, key_results(id, title, current_value, target_value, progress, unit, sort_order)")
        .eq("user_id", memberId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      // Enrollments with course info
      serviceClient
        .from("enrollments")
        .select("id, status, progress, course:courses(id, title, category)")
        .eq("user_id", memberId)
        .in("status", ["in_progress", "completed"]),

      // Career progress
      serviceClient
        .from("user_career_progress")
        .select("id, current_level_id, qualifying_okr_count, total_okrs_attempted, level_confirmed_at, created_at, updated_at")
        .eq("user_id", memberId)
        .eq("organization_id", orgId)
        .maybeSingle(),
    ]);

    if (profileRes.error || !profileRes.data) {
      logger.error("Failed to fetch member profile", { requestId, error: profileRes.error?.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 })
      ));
    }

    // Resolve career level name if career_level_id is set
    let careerLevel = null;
    if (profileRes.data.career_level_id) {
      const { data: level } = await serviceClient
        .from("career_levels")
        .select("id, name, sort_order, min_okrs_with_target_score, target_score_threshold, description, organization_id, created_at")
        .eq("id", profileRes.data.career_level_id)
        .single();
      careerLevel = level;
    }

    // Sort key_results within each OKR
    const okrs = (okrsRes.data || []).map((okr) => ({
      ...okr,
      key_results: (okr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    }));

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({
        member: {
          ...profileRes.data,
          okrs,
          enrollments: enrollmentsRes.data || [],
          career_progress: careerProgressRes.data || null,
          career_level: careerLevel,
        },
      })
    ));
  } catch (error) {
    logger.error("GET /api/team/members/[id] error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}

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

    const serviceClient = await createServiceClient();

    const profileData = await ensureProfileWithOrg(serviceClient, user.id, user.email);
    if (!profileData) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Profil konnte nicht geladen werden" }, { status: 500 })
      ));
    }
    const { organization_id: orgId, role: userRole } = profileData;

    // Check edit access
    const access = await checkAccess(serviceClient, user.id, orgId, userRole, memberId, true);
    if (!access.allowed) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: access.error }, { status: access.status })
      ));
    }

    // Validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 })
      ));
    }

    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten() }, { status: 400 })
      ));
    }

    // Build update object — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (parsed.data.position !== undefined) updateData.position = parsed.data.position;
    if (parsed.data.craft_focus !== undefined) updateData.craft_focus = parsed.data.craft_focus;
    if (parsed.data.career_level_id !== undefined) updateData.career_level_id = parsed.data.career_level_id;
    if (parsed.data.department !== undefined) updateData.department = parsed.data.department;

    if (Object.keys(updateData).length === 0) {
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Keine Änderungen angegeben" }, { status: 400 })
      ));
    }

    // If career_level_id is provided and not null, validate it exists
    if (updateData.career_level_id) {
      const { data: level } = await serviceClient
        .from("career_levels")
        .select("id")
        .eq("id", updateData.career_level_id as string)
        .eq("organization_id", orgId)
        .single();
      if (!level) {
        return withRateLimitHeaders(withCorsHeaders(
          NextResponse.json({ error: "Karrierestufe nicht gefunden" }, { status: 400 })
        ));
      }
    }

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update(updateData)
      .eq("id", memberId);

    if (updateError) {
      logger.error("Failed to update member profile", { requestId, error: updateError.message });
      return withRateLimitHeaders(withCorsHeaders(
        NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
      ));
    }

    logger.audit("member.profile_updated", {
      requestId,
      userId: user.id,
      memberId,
      fields: Object.keys(updateData),
    });

    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ success: true })
    ));
  } catch (error) {
    logger.error("PATCH /api/team/members/[id] error", { requestId, error: error instanceof Error ? error.message : String(error) });
    return withRateLimitHeaders(withCorsHeaders(
      NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
    ));
  }
}
