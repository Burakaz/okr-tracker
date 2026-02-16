import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  const reqLog = logger.request("GET", "/api/auth/me", { requestId });

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    const serviceClient = await createServiceClient();
    let { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    // Self-healing: create profile if missing (trigger may have failed)
    if (profileError || !profile) {
      logger.warn("Profile missing, auto-creating for user", {
        requestId,
        userId: authUser.id,
      });

      // Ensure default organization exists
      let orgId: string | null = null;
      const { data: defaultOrg } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("slug", "admkrs")
        .single();

      if (defaultOrg) {
        orgId = defaultOrg.id;
      } else {
        // Create default org
        const { data: newOrg } = await serviceClient
          .from("organizations")
          .insert({ name: "ADMKRS", slug: "admkrs" })
          .select("id")
          .single();
        orgId = newOrg?.id ?? null;
      }

      // Create the profile
      const { data: newProfile, error: createError } = await serviceClient
        .from("profiles")
        .upsert({
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "",
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || "",
          organization_id: orgId,
          role: "employee",
          status: "active",
        })
        .select("*")
        .single();

      if (createError || !newProfile) {
        logger.error("Failed to auto-create profile", {
          requestId,
          userId: authUser.id,
          error: createError?.message,
        });
        reqLog.finish(500, { userId: authUser.id });
        return withRateLimitHeaders(
          withCorsHeaders(
            NextResponse.json(
              { error: "Profil konnte nicht erstellt werden" },
              { status: 500 }
            )
          )
        );
      }

      profile = newProfile;
    }

    // Self-healing: assign organization if profile exists but org is missing
    if (!profile.organization_id) {
      logger.warn("Profile missing organization_id, auto-assigning", {
        requestId,
        userId: authUser.id,
      });

      const { data: defaultOrg } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("slug", "admkrs")
        .single();

      if (defaultOrg) {
        const { data: updatedProfile } = await serviceClient
          .from("profiles")
          .update({ organization_id: defaultOrg.id })
          .eq("id", authUser.id)
          .select("*")
          .single();

        if (updatedProfile) {
          profile = updatedProfile;
        }
      }
    }

    const user = {
      id: profile.id,
      email: profile.email || authUser.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      department: profile.department,
      position: profile.position || null,
      craft_focus: profile.craft_focus || null,
      manager_id: profile.manager_id,
      career_level_id: profile.career_level_id,
      organization_id: profile.organization_id,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    reqLog.finish(200, { userId: authUser.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ user }))
    );
  } catch (error) {
    logger.error("GET /api/auth/me unhandled error", {
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

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLog = logger.request("PATCH", "/api/auth/me", { requestId });

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    const body = await request.json();
    const allowedFields = ["name", "department", "position", "craft_focus"];
    const updates: Record<string, string> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = String(body[field]).trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Keine gültigen Felder zum Aktualisieren" }, { status: 400 })
        )
      );
    }

    // Validate name
    if (updates.name !== undefined && updates.name.length < 2) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Name muss mindestens 2 Zeichen lang sein" }, { status: 400 })
        )
      );
    }

    const serviceClient = await createServiceClient();
    const { data: profile, error: updateError } = await serviceClient
      .from("profiles")
      .update(updates)
      .eq("id", authUser.id)
      .select("*")
      .single();

    if (updateError || !profile) {
      logger.error("Failed to update profile", { requestId, error: updateError?.message });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
        )
      );
    }

    reqLog.finish(200, { userId: authUser.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ user: profile }))
    );
  } catch (error) {
    logger.error("PATCH /api/auth/me unhandled error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
      )
    );
  }
}
