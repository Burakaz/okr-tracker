import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Get the user's profile to find organization_id
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      return NextResponse.json({ progress: null });
    }

    const { data: progress, error } = await serviceClient
      .from("user_career_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error) {
      // No career progress record yet is not an error
      if (error.code === "PGRST116") {
        return NextResponse.json({ progress: null });
      }
      console.error("GET /api/career error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden des Karriere-Fortschritts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("GET /api/career error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
