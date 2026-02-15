import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createOKRSchema } from "@/lib/validation";
import { logOKRCreate } from "@/lib/audit";
import { getQuarterDateRange, MAX_OKRS_PER_QUARTER } from "@/lib/okr-logic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter");

    const serviceClient = await createServiceClient();

    let query = serviceClient
      .from("okrs")
      .select("*, key_results(*)")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (quarter) {
      query = query.eq("quarter", quarter);
    }

    const { data: okrs, error } = await query;

    if (error) {
      console.error("GET /api/okrs error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der OKRs" },
        { status: 500 }
      );
    }

    // Sort key_results by sort_order within each OKR
    const sortedOkrs = (okrs || []).map((okr) => ({
      ...okr,
      key_results: (okr.key_results || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    }));

    return NextResponse.json({ okrs: sortedOkrs });
  } catch (error) {
    console.error("GET /api/okrs error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createOKRSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const serviceClient = await createServiceClient();

    // Get the user's profile to find organization_id
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
      );
    }

    const orgId = profile.organization_id;

    if (!orgId) {
      return NextResponse.json(
        { error: "Keine Organisation zugewiesen" },
        { status: 400 }
      );
    }

    // Enforce MAX_OKRS_PER_QUARTER limit
    const { count, error: countError } = await serviceClient
      .from("okrs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("quarter", data.quarter)
      .eq("is_active", true);

    if (countError) {
      console.error("Count error:", countError);
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

    // Calculate due_date from quarter end if not provided
    let dueDate = data.due_date || null;
    if (!dueDate) {
      const { end } = getQuarterDateRange(data.quarter);
      dueDate = end.toISOString().split("T")[0];
    }

    // Get next sort_order
    const { data: lastOkr } = await serviceClient
      .from("okrs")
      .select("sort_order")
      .eq("user_id", user.id)
      .eq("quarter", data.quarter)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastOkr?.sort_order ?? -1) + 1;

    // Create the OKR
    const { data: newOkr, error: insertError } = await serviceClient
      .from("okrs")
      .insert({
        user_id: user.id,
        organization_id: orgId,
        title: data.title,
        why_it_matters: data.why_it_matters || null,
        quarter: data.quarter,
        category: data.category,
        scope: data.scope,
        due_date: dueDate,
        team_id: data.team_id || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError || !newOkr) {
      console.error("Insert OKR error:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen des OKR" },
        { status: 500 }
      );
    }

    // Create key results
    const keyResultsToInsert = data.key_results.map((kr, index) => ({
      okr_id: newOkr.id,
      title: kr.title,
      start_value: kr.start_value,
      target_value: kr.target_value,
      current_value: kr.start_value,
      unit: kr.unit || null,
      sort_order: index,
    }));

    const { data: insertedKRs, error: krError } = await serviceClient
      .from("key_results")
      .insert(keyResultsToInsert)
      .select();

    if (krError) {
      console.error("Insert KR error:", krError);
      // Rollback: delete the OKR if key results fail
      await serviceClient.from("okrs").delete().eq("id", newOkr.id);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Key Results" },
        { status: 500 }
      );
    }

    // Audit log (non-blocking)
    logOKRCreate(user.id, orgId, newOkr.id, data.title).catch(() => {});

    return NextResponse.json(
      { okr: { ...newOkr, key_results: insertedKRs } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/okrs error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
