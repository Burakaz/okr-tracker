import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logOKRArchive, logOKRRestore } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const archive = body.archive as boolean;

    if (typeof archive !== "boolean") {
      return NextResponse.json(
        { error: "Feld 'archive' (boolean) ist erforderlich" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Fetch existing OKR to verify ownership
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("id, title, organization_id, user_id, is_active")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingOkr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    // Toggle is_active (archive = set inactive, restore = set active)
    const newIsActive = !archive;

    const { data: updatedOkr, error: updateError } = await serviceClient
      .from("okrs")
      .update({ is_active: newIsActive, is_focus: false })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, key_results(*)")
      .single();

    if (updateError) {
      console.error("Archive OKR error:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Archivieren/Wiederherstellen" },
        { status: 500 }
      );
    }

    // Audit log (non-blocking)
    if (archive) {
      logOKRArchive(
        user.id,
        existingOkr.organization_id,
        id,
        existingOkr.title
      ).catch(() => {});
    } else {
      logOKRRestore(
        user.id,
        existingOkr.organization_id,
        id,
        existingOkr.title
      ).catch(() => {});
    }

    return NextResponse.json({ okr: updatedOkr });
  } catch (error) {
    console.error("POST /api/okrs/[id]/archive error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
