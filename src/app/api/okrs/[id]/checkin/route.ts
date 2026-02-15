import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCheckinSchema } from "@/lib/validation";
import { logCheckinCreate } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: okrId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Verify the user owns the OKR
    const { data: okr, error: okrError } = await serviceClient
      .from("okrs")
      .select("id, user_id")
      .eq("id", okrId)
      .eq("user_id", user.id)
      .single();

    if (okrError || !okr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    const { data: checkins, error } = await serviceClient
      .from("okr_checkins")
      .select("*")
      .eq("okr_id", okrId)
      .order("checked_at", { ascending: false });

    if (error) {
      console.error("GET checkins error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Check-ins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkins: checkins || [] });
  } catch (error) {
    console.error("GET /api/okrs/[id]/checkin error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: okrId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCheckinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const serviceClient = await createServiceClient();

    // Verify user owns the OKR and fetch current state
    const { data: okr, error: okrError } = await serviceClient
      .from("okrs")
      .select("id, user_id, organization_id, is_active, progress")
      .eq("id", okrId)
      .eq("user_id", user.id)
      .single();

    if (okrError || !okr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    if (!okr.is_active) {
      return NextResponse.json(
        { error: "Check-in für archivierte OKRs nicht möglich" },
        { status: 400 }
      );
    }

    // Update key result current_values (triggers auto-calculate KR progress + OKR progress)
    for (const krUpdate of data.key_result_updates) {
      const { error: krError } = await serviceClient
        .from("key_results")
        .update({ current_value: krUpdate.current_value })
        .eq("id", krUpdate.id)
        .eq("okr_id", okrId);

      if (krError) {
        console.error("KR update error:", krError);
        return NextResponse.json(
          { error: `Fehler beim Aktualisieren von Key Result ${krUpdate.id}` },
          { status: 500 }
        );
      }
    }

    // Fetch the updated OKR progress (after triggers have fired)
    const { data: updatedOkr } = await serviceClient
      .from("okrs")
      .select("progress")
      .eq("id", okrId)
      .single();

    const newProgress = updatedOkr?.progress ?? okr.progress;

    // Create the check-in record
    // (triggers auto_checkin_updates: sets last_checkin_at, next_checkin_at, checkin_count, confidence)
    const { data: checkin, error: checkinError } = await serviceClient
      .from("okr_checkins")
      .insert({
        okr_id: okrId,
        user_id: user.id,
        progress_update: newProgress,
        confidence: data.confidence,
        what_helped: data.what_helped || null,
        what_blocked: data.what_blocked || null,
        next_steps: data.next_steps || null,
        change_type: "progress",
        change_details: {
          key_result_updates: data.key_result_updates,
          previous_progress: okr.progress,
          new_progress: newProgress,
        },
      })
      .select()
      .single();

    if (checkinError || !checkin) {
      console.error("Insert checkin error:", checkinError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Check-ins" },
        { status: 500 }
      );
    }

    // Fetch the full updated OKR with key results
    const { data: fullOkr } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", okrId)
      .single();

    // Sort key_results
    if (fullOkr) {
      fullOkr.key_results = (fullOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    logCheckinCreate(
      user.id,
      okr.organization_id,
      checkin.id,
      okrId
    ).catch(() => {});

    return NextResponse.json(
      { checkin, okr: fullOkr },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/okrs/[id]/checkin error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
