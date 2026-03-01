/**
 * Seed script: Creates 4 demo OKRs with diverse KRs for the demo user.
 * Run: node scripts/seed-demo-okrs.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l && !l.startsWith("#")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx), l.slice(idx + 1)];
  })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_EMAIL = process.argv[2] || "demo@admkrs.com";

async function main() {
  // 1. Find demo user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("email", DEMO_EMAIL)
    .single();

  if (profileError || !profile) {
    console.error("Demo user not found. Run /auth/demo first.", profileError);
    process.exit(1);
  }

  const userId = profile.id;
  const orgId = profile.organization_id;
  const quarter = "Q1 2026";
  const dueDate = "2026-03-31";
  const now = new Date().toISOString();

  console.log(`Found demo user: ${userId} in org: ${orgId}`);

  // 2. Delete existing OKRs for this user in this quarter (clean slate)
  const { data: existingOkrs } = await supabase
    .from("okrs")
    .select("id")
    .eq("user_id", userId)
    .eq("quarter", quarter);

  if (existingOkrs && existingOkrs.length > 0) {
    const okrIds = existingOkrs.map((o) => o.id);
    // Delete KRs first (foreign key)
    await supabase.from("key_results").delete().in("okr_id", okrIds);
    // Delete checkins
    await supabase.from("checkins").delete().in("okr_id", okrIds);
    // Delete OKRs
    await supabase.from("okrs").delete().in("id", okrIds);
    console.log(`Deleted ${existingOkrs.length} existing OKRs`);
  }

  // 3. Define 4 OKRs with diverse KRs
  const okrDefinitions = [
    {
      title: "Q1 ROAS Optimierung",
      why_it_matters: "Höherer ROAS bedeutet mehr Budget für Skalierung und neue Kanäle.",
      category: "skill",
      scope: "personal",
      confidence: 5,
      progress: 95,
      status: "on_track",
      last_checkin_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      next_checkin_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      checkin_count: 4,
      key_results: [
        { title: "ROAS steigern", start: 0, target: 4.5, current: 4, unit: "x" },
        { title: "CPA senken", start: 30, target: 15, current: 14, unit: "€" },
        { title: "Kampagnen mit positivem ROAS", start: 0, target: 80, current: 77, unit: "%" },
        { title: "UGC-Anteil im Funnel erhöhen", start: 0, target: 30, current: 30, unit: "%" },
      ],
    },
    {
      title: "Skalierungsfähigkeit herstellen",
      why_it_matters: "Ohne Skalierungsfähigkeit können wir bei steigendem Budget nicht mithalten.",
      category: "performance",
      scope: "personal",
      confidence: 3,
      progress: 44,
      status: "at_risk",
      last_checkin_at: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
      next_checkin_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      checkin_count: 2,
      key_results: [
        { title: "Testing-Budget Anteil am AdSpend", start: 0, target: 10, current: 5, unit: "%" },
        { title: "Neue Creative-Konzepte pro Woche live", start: 0, target: 5, current: 3, unit: "x" },
        { title: "Hook-Varianten pro Asset", start: 0, target: 3, current: 2, unit: "x" },
        { title: "Pünktliche Kampagnen-Launches", start: 0, target: 90, current: 0, unit: "%" },
      ],
    },
    {
      title: "Team-Weiterbildung vorantreiben",
      why_it_matters: "Investition in Skills sorgt für langfristige Wettbewerbsvorteile.",
      category: "learning",
      scope: "team",
      confidence: 4,
      progress: 72,
      status: "on_track",
      last_checkin_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      next_checkin_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      checkin_count: 3,
      key_results: [
        { title: "Team-Mitglieder mit Zertifizierung", start: 0, target: 4, current: 3, unit: "Personen" },
        { title: "Schulungsstunden pro Mitarbeiter", start: 0, target: 20, current: 15, unit: "h" },
        { title: "Neue Frameworks im Einsatz", start: 0, target: 2, current: 1, unit: "x" },
      ],
    },
    {
      title: "Karrierepfad zum Senior definieren",
      why_it_matters: "Klare Karrierepfade erhöhen Retention und Motivation.",
      category: "career",
      scope: "personal",
      confidence: 2,
      progress: 25,
      status: "off_track",
      last_checkin_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      next_checkin_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      checkin_count: 1,
      key_results: [
        { title: "Mentoring-Sessions absolviert", start: 0, target: 8, current: 2, unit: "x" },
        { title: "Side-Projects abgeschlossen", start: 0, target: 2, current: 0, unit: "x" },
        { title: "Konferenz-Talks gehalten", start: 0, target: 1, current: 1, unit: "x" },
      ],
    },
  ];

  // 4. Insert OKRs and KRs
  for (let i = 0; i < okrDefinitions.length; i++) {
    const def = okrDefinitions[i];

    const { data: okr, error: okrError } = await supabase
      .from("okrs")
      .insert({
        user_id: userId,
        organization_id: orgId,
        title: def.title,
        why_it_matters: def.why_it_matters,
        quarter,
        category: def.category,
        scope: def.scope,
        progress: def.progress,
        status: def.status,
        confidence: def.confidence,
        due_date: dueDate,
        is_active: true,
        is_focus: false,
        sort_order: i,
        last_checkin_at: def.last_checkin_at,
        next_checkin_at: def.next_checkin_at,
        checkin_count: def.checkin_count,
      })
      .select()
      .single();

    if (okrError) {
      console.error(`Failed to create OKR "${def.title}":`, okrError);
      continue;
    }

    console.log(`✅ Created OKR: ${def.title} (${okr.id})`);

    // Insert KRs
    const krsToInsert = def.key_results.map((kr, idx) => {
      const progress =
        kr.target === kr.start
          ? kr.current >= kr.target ? 100 : 0
          : Math.max(0, Math.round(((kr.current - kr.start) / (kr.target - kr.start)) * 100));

      return {
        okr_id: okr.id,
        title: kr.title,
        start_value: kr.start,
        target_value: kr.target,
        current_value: kr.current,
        unit: kr.unit,
        progress,
        sort_order: idx,
      };
    });

    const { error: krError } = await supabase
      .from("key_results")
      .insert(krsToInsert);

    if (krError) {
      console.error(`  Failed to create KRs for "${def.title}":`, krError);
    } else {
      console.log(`   → ${krsToInsert.length} Key Results created`);
    }
  }

  console.log("\n🎉 Seed complete! 4 OKRs with diverse KRs created.");
}

main().catch(console.error);
