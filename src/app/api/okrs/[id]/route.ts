import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateOKRSchema } from "@/lib/validation";
import { logOKRUpdate, logOKRDelete } from "@/lib/audit";
import { calculateStatus } from "@/lib/okr-logic";

export async function GET(
  _request: NextRequest,
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

    const serviceClient = await createServiceClient();

    const { data: okr, error } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !okr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    // Sort key_results by sort_order
    okr.key_results = (okr.key_results || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );

    return NextResponse.json({ okr });
  } catch (error) {
    console.error("GET /api/okrs/[id] error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const parsed = updateOKRSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const serviceClient = await createServiceClient();

    // Fetch the existing OKR to check ownership and compute diffs
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingOkr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    // Calculate field-level diffs for audit
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(data)) {
      if (newValue !== undefined) {
        const oldValue = existingOkr[key as keyof typeof existingOkr];
        if (oldValue !== newValue) {
          changedFields[key] = { old: oldValue, new: newValue };
        }
      }
    }

    // Build the update object with only changed fields
    const updateData: Record<string, unknown> = {};
    for (const key of Object.keys(changedFields)) {
      updateData[key] = data[key as keyof typeof data];
    }

    // If nothing changed, return the existing OKR
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ okr: existingOkr });
    }

    // Recalculate status if progress-related fields changed
    if (existingOkr.due_date) {
      const newProgress = existingOkr.progress;
      const dueDate =
        (updateData.due_date as string) || existingOkr.due_date;
      const newStatus = calculateStatus(
        newProgress,
        existingOkr.created_at,
        dueDate
      );
      if (newStatus !== existingOkr.status) {
        updateData.status = newStatus;
      }
    }

    const { data: updatedOkr, error: updateError } = await serviceClient
      .from("okrs")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, key_results(*)")
      .single();

    if (updateError) {
      console.error("Update OKR error:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren" },
        { status: 500 }
      );
    }

    // Sort key_results
    if (updatedOkr) {
      updatedOkr.key_results = (updatedOkr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Audit log (non-blocking)
    if (Object.keys(changedFields).length > 0) {
      logOKRUpdate(
        user.id,
        existingOkr.organization_id,
        id,
        changedFields
      ).catch(() => {});
    }

    return NextResponse.json({ okr: updatedOkr });
  } catch (error) {
    console.error("PATCH /api/okrs/[id] error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const serviceClient = await createServiceClient();

    // Fetch the OKR to verify ownership and get details for audit
    const { data: existingOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("id, title, organization_id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingOkr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    // Soft delete: set is_active = false
    const { error: deleteError } = await serviceClient
      .from("okrs")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete OKR error:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Löschen" },
        { status: 500 }
      );
    }

    // Audit log (non-blocking)
    logOKRDelete(
      user.id,
      existingOkr.organization_id,
      id,
      existingOkr.title
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/okrs/[id] error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
