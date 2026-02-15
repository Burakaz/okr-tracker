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
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      logger.warn("Profile not found for authenticated user", {
        requestId,
        userId: authUser.id,
      });
      reqLog.finish(404, { userId: authUser.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Profil nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    const user = {
      id: profile.id,
      email: profile.email || authUser.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      department: profile.department,
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
    const allowedFields = ["name", "department"];
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
