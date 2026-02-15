import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { duplicateOKRSchema } from "@/lib/validation";
import { logOKRDuplicate } from "@/lib/audit";
import { getQuarterDateRange, MAX_OKRS_PER_QUARTER } from "@/lib/okr-logic";

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
    const parsed = duplicateOKRSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const serviceClient = await createServiceClient();

    // Fetch existing OKR with key results
    const { data: sourceOkr, error: fetchError } = await serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !sourceOkr) {
      return NextResponse.json(
        { error: "OKR nicht gefunden" },
        { status: 404 }
      );
    }

    // Enforce limit in target quarter
    const { count, error: countError } = await serviceClient
      .from("okrs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("quarter", data.target_quarter)
      .eq("is_active", true);

    if (countError) {
      return NextResponse.json(
        { error: "Fehler beim Prüfen des OKR-Limits" },
        { status: 500 }
      );
    }

    if ((count || 0) >= MAX_OKRS_PER_QUARTER) {
      return NextResponse.json(
        {
          error: `Maximal ${MAX_OKRS_PER_QUARTER} OKRs pro Quartal erlaubt`,
        },
        { status: 400 }
      );
    }

    // Calculate due_date for the target quarter
    const { end } = getQuarterDateRange(data.target_quarter);
    const dueDate = end.toISOString().split("T")[0];

    // Get next sort_order in the target quarter
    const { data: lastOkr } = await serviceClient
      .from("okrs")
      .select("sort_order")
      .eq("user_id", user.id)
      .eq("quarter", data.target_quarter)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastOkr?.sort_order ?? -1) + 1;

    // Create duplicate OKR
    const { data: newOkr, error: insertError } = await serviceClient
      .from("okrs")
      .insert({
        user_id: user.id,
        organization_id: sourceOkr.organization_id,
        title: sourceOkr.title,
        why_it_matters: sourceOkr.why_it_matters,
        quarter: data.target_quarter,
        category: sourceOkr.category,
        scope: sourceOkr.scope,
        due_date: dueDate,
        team_id: sourceOkr.team_id,
        sort_order: nextSortOrder,
        progress: data.reset_progress ? 0 : sourceOkr.progress,
        confidence: data.reset_progress ? 3 : sourceOkr.confidence,
      })
      .select()
      .single();

    if (insertError || !newOkr) {
      console.error("Duplicate OKR insert error:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Duplizieren" },
        { status: 500 }
      );
    }

    // Optionally copy key results
    let insertedKRs = null;
    if (data.copy_key_results && sourceOkr.key_results?.length > 0) {
      const krData = sourceOkr.key_results.map(
        (
          kr: {
            title: string;
            start_value: number;
            target_value: number;
            current_value: number;
            unit: string | null;
            sort_order: number;
            source_url: string | null;
            source_label: string | null;
          },
          index: number
        ) => ({
          okr_id: newOkr.id,
          title: kr.title,
          start_value: kr.start_value,
          target_value: kr.target_value,
          current_value: data.reset_progress ? kr.start_value : kr.current_value,
          unit: kr.unit,
          sort_order: index,
          source_url: kr.source_url,
          source_label: kr.source_label,
        })
      );

      const { data: krs, error: krError } = await serviceClient
        .from("key_results")
        .insert(krData)
        .select();

      if (krError) {
        console.error("Duplicate KR insert error:", krError);
        // Rollback the new OKR
        await serviceClient.from("okrs").delete().eq("id", newOkr.id);
        return NextResponse.json(
          { error: "Fehler beim Duplizieren der Key Results" },
          { status: 500 }
        );
      }

      insertedKRs = krs;
    }

    // Audit log (non-blocking)
    logOKRDuplicate(
      user.id,
      sourceOkr.organization_id,
      id,
      newOkr.id,
      data.target_quarter
    ).catch(() => {});

    return NextResponse.json(
      { okr: { ...newOkr, key_results: insertedKRs || [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/okrs/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
