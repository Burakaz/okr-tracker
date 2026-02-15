import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
