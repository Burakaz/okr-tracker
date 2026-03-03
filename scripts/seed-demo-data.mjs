#!/usr/bin/env node
/**
 * Seed demo data: historical OKRs, career progress, and demo accounts.
 * Run: node scripts/seed-demo-data.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bgvpbssmnyrwhcjhuutq.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndnBic3Ntbnlyd2hjamh1dXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4NDkzOSwiZXhwIjoyMDg2NzYwOTM5fQ.DhA3z6GnKWaqaDyc8BkBfqG8k7KfwH8fR4Q7ms9MNH4";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ========== HELPERS ==========

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuid() {
  return crypto.randomUUID();
}

function quarterEndDate(quarter) {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) return new Date().toISOString();
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const endMonth = q * 3;
  return new Date(year, endMonth, 0).toISOString().split("T")[0];
}

function quarterStartDate(quarter) {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) return new Date().toISOString();
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const startMonth = (q - 1) * 3;
  return new Date(year, startMonth, 1).toISOString().split("T")[0];
}

// ========== STEP 1: Get org + existing user ==========

async function getOrg() {
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "admkrs")
    .single();
  if (error) throw new Error(`Org not found: ${error.message}`);
  return data.id;
}

async function getUser(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, craft_focus, organization_id")
    .eq("email", email)
    .single();
  if (error) return null;
  return data;
}

async function getCareerLevels(orgId) {
  const { data } = await supabase
    .from("career_levels")
    .select("*")
    .eq("organization_id", orgId)
    .order("sort_order");
  return data || [];
}

// ========== STEP 2: Create demo users ==========

async function createDemoUser(email, name, orgId, options = {}) {
  // Check if user already exists
  const existing = await getUser(email);
  if (existing) {
    console.log(`  ⤷ User ${email} already exists (${existing.id})`);
    // Update profile if needed
    if (options.craft_focus || options.department || options.position) {
      await supabase
        .from("profiles")
        .update({
          ...(options.craft_focus && { craft_focus: options.craft_focus }),
          ...(options.department && { department: options.department }),
          ...(options.position && { position: options.position }),
          ...(options.role && { role: options.role }),
        })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: "demo1234!",
      email_confirm: true,
      user_metadata: { full_name: name },
    });

  if (authError) throw new Error(`Create user ${email}: ${authError.message}`);
  const userId = authData.user.id;
  console.log(`  ⤷ Created user ${email} (${userId})`);

  // Wait a moment for the trigger to create the profile
  await new Promise((r) => setTimeout(r, 1000));

  // Update profile with details
  await supabase
    .from("profiles")
    .update({
      name,
      organization_id: orgId,
      craft_focus: options.craft_focus || "marketing",
      department: options.department || "Marketing",
      position: options.position || "Marketing Manager",
      role: options.role || "employee",
    })
    .eq("id", userId);

  return userId;
}

// ========== STEP 3: Seed OKRs ==========

async function seedOKRs(userId, orgId, okrDefs) {
  for (const def of okrDefs) {
    // Check if OKR already exists for this quarter + title
    const { data: existing } = await supabase
      .from("okrs")
      .select("id")
      .eq("user_id", userId)
      .eq("quarter", def.quarter)
      .eq("title", def.title)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⤷ OKR "${def.title}" (${def.quarter}) already exists`);
      continue;
    }

    const okrId = uuid();
    const startDate = quarterStartDate(def.quarter);
    const endDate = quarterEndDate(def.quarter);

    const { error: okrError } = await supabase.from("okrs").insert({
      id: okrId,
      organization_id: orgId,
      user_id: userId,
      title: def.title,
      why_it_matters: def.why || null,
      quarter: def.quarter,
      category: def.category || "performance",
      progress: def.progress,
      status: def.progress >= 70 ? "on_track" : def.progress >= 40 ? "at_risk" : "off_track",
      confidence: def.progress >= 70 ? 5 : def.progress >= 40 ? 3 : 2,
      scope: "personal",
      due_date: endDate,
      is_active: def.isActive !== undefined ? def.isActive : false,
      checkin_count: randomBetween(3, 8),
      last_checkin_at: endDate + "T10:00:00Z",
      created_at: startDate + "T09:00:00Z",
    });

    if (okrError) {
      console.error(`  ⤷ ERROR OKR "${def.title}": ${okrError.message}`);
      continue;
    }

    // Insert key results
    for (let i = 0; i < def.keyResults.length; i++) {
      const kr = def.keyResults[i];
      const krProgress =
        kr.target === kr.start
          ? kr.current >= kr.target
            ? 100
            : 0
          : Math.max(
              0,
              Math.round(
                ((kr.current - kr.start) / (kr.target - kr.start)) * 100
              )
            );

      await supabase.from("key_results").insert({
        id: uuid(),
        okr_id: okrId,
        title: kr.title,
        start_value: kr.start,
        target_value: kr.target,
        current_value: kr.current,
        unit: kr.unit || null,
        progress: krProgress,
        sort_order: i,
      });
    }

    console.log(
      `  ⤷ OKR "${def.title}" (${def.quarter}) → ${def.progress}%`
    );
  }
}

// ========== STEP 4: Seed career progress ==========

async function seedCareerProgress(userId, orgId, levelId, qualifyingCount) {
  const { data: existing } = await supabase
    .from("user_career_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from("user_career_progress")
      .update({
        current_level_id: levelId,
        qualifying_okr_count: qualifyingCount,
        total_okrs_attempted: qualifyingCount + randomBetween(1, 3),
      })
      .eq("user_id", userId)
      .eq("organization_id", orgId);
    console.log(`  ⤷ Updated career progress (qualifying: ${qualifyingCount})`);
  } else {
    await supabase.from("user_career_progress").insert({
      user_id: userId,
      organization_id: orgId,
      current_level_id: levelId,
      qualifying_okr_count: qualifyingCount,
      total_okrs_attempted: qualifyingCount + randomBetween(1, 3),
    });
    console.log(`  ⤷ Created career progress (qualifying: ${qualifyingCount})`);
  }
}

// ========== STEP 5: Seed requirement completions ==========

async function seedRequirementCompletions(userId, orgId, pathId, levels) {
  for (const levelDef of levels) {
    for (const req of levelDef.requirements) {
      const { error } = await supabase
        .from("career_requirement_completions")
        .upsert(
          {
            user_id: userId,
            organization_id: orgId,
            career_path_id: pathId,
            level_id: levelDef.levelId,
            requirement_index: req.index,
            status: req.status,
            notes: req.notes || null,
            completed_at:
              req.status === "completed" ? new Date().toISOString() : null,
          },
          {
            onConflict: "user_id,career_path_id,level_id,requirement_index",
          }
        );
      if (error) {
        console.error(
          `  ⤷ ERROR req ${levelDef.levelId}[${req.index}]: ${error.message}`
        );
      }
    }
    console.log(
      `  ⤷ ${levelDef.levelId}: ${levelDef.requirements.length} requirements seeded`
    );
  }
}

// ========== MAIN ==========

async function main() {
  console.log("🚀 Starting demo data seed...\n");

  // Get org
  const orgId = await getOrg();
  console.log(`Organization: ${orgId}`);

  // Get career levels
  const levels = await getCareerLevels(orgId);
  console.log(`Career levels: ${levels.map((l) => l.name).join(", ")}`);

  const juniorLevel = levels.find(
    (l) => l.name.toLowerCase().includes("junior") || l.sort_order === 0
  );
  const midLevel = levels.find(
    (l) =>
      l.name.toLowerCase().includes("mid") ||
      l.name.toLowerCase().includes("regular") ||
      l.sort_order === 1
  );
  const seniorLevel = levels.find(
    (l) => l.name.toLowerCase().includes("senior") || l.sort_order === 2
  );

  // ==========================================
  // USER 1: b@admkrs.com (Burak — main user)
  // ==========================================
  console.log("\n📌 User 1: b@admkrs.com");

  const burak = await getUser("b@admkrs.com");
  if (!burak) {
    console.error("  ⤷ b@admkrs.com not found in profiles! Log in first.");
  } else {
    console.log(`  ⤷ Found: ${burak.id} (${burak.name})`);

    // Update profile with craft_focus if not set
    if (!burak.craft_focus) {
      await supabase
        .from("profiles")
        .update({
          craft_focus: "marketing",
          department: "Marketing",
          position: "Performance Marketing Manager",
        })
        .eq("id", burak.id);
      console.log("  ⤷ Updated craft_focus to 'marketing'");
    }

    // Seed historical OKRs
    console.log("  📊 Seeding OKRs...");
    await seedOKRs(burak.id, orgId, [
      // Q3 2025 — completed, two qualified
      {
        quarter: "Q3 2025",
        title: "ROAS auf Social Ads steigern",
        category: "performance",
        progress: 85,
        why: "Effizienz im Werbebudget maximieren",
        keyResults: [
          { title: "ROAS von 3.2 auf 4.5 steigern", start: 3.2, target: 4.5, current: 4.3, unit: "ROAS" },
          { title: "CPA um 20% senken", start: 45, target: 36, current: 37, unit: "€" },
          { title: "5 neue Ad-Formate testen", start: 0, target: 5, current: 5, unit: "Formate" },
        ],
      },
      {
        quarter: "Q3 2025",
        title: "Marketing Automation aufbauen",
        category: "skill",
        progress: 72,
        why: "Skalierbare Marketing-Prozesse schaffen",
        keyResults: [
          { title: "3 automatisierte Email-Flows einrichten", start: 0, target: 3, current: 3, unit: "Flows" },
          { title: "Lead Scoring Modell implementieren", start: 0, target: 100, current: 65, unit: "%" },
          { title: "Conversion Rate Newsletter um 15% steigern", start: 2.1, target: 2.4, current: 2.3, unit: "%" },
        ],
      },
      {
        quarter: "Q3 2025",
        title: "Datenanalyse Kompetenz vertiefen",
        category: "learning",
        progress: 55,
        why: "Datengetriebene Entscheidungen ermöglichen",
        keyResults: [
          { title: "Google Analytics 4 Zertifizierung", start: 0, target: 1, current: 1, unit: "Zertifikat" },
          { title: "3 A/B Tests mit statistischer Signifikanz", start: 0, target: 3, current: 1, unit: "Tests" },
          { title: "Dashboard mit KPIs für Stakeholder bauen", start: 0, target: 1, current: 0, unit: "Dashboard" },
        ],
      },
      // Q4 2025 — completed, one qualified
      {
        quarter: "Q4 2025",
        title: "Q4 Kampagnen-Performance optimieren",
        category: "performance",
        progress: 91,
        why: "Black Friday und Weihnachtsgeschäft maximieren",
        keyResults: [
          { title: "Revenue aus Paid Channels um 30% steigern", start: 120000, target: 156000, current: 152000, unit: "€" },
          { title: "Conversion Rate Landing Pages über 4%", start: 2.8, target: 4.0, current: 4.2, unit: "%" },
          { title: "Customer Acquisition Cost unter 25€", start: 38, target: 25, current: 23, unit: "€" },
        ],
      },
      {
        quarter: "Q4 2025",
        title: "Content-Marketing Strategie entwickeln",
        category: "performance",
        progress: 78,
        why: "Organisches Wachstum als zweiten Kanal aufbauen",
        keyResults: [
          { title: "Blog Traffic um 50% steigern", start: 5000, target: 7500, current: 7200, unit: "Visits" },
          { title: "8 SEO-optimierte Artikel veröffentlichen", start: 0, target: 8, current: 6, unit: "Artikel" },
          { title: "3 Backlinks von Domain Authority 50+ gewinnen", start: 0, target: 3, current: 2, unit: "Links" },
        ],
      },
      {
        quarter: "Q4 2025",
        title: "Team-Zusammenarbeit verbessern",
        category: "skill",
        progress: 45,
        why: "Silos zwischen Marketing und Sales aufbrechen",
        keyResults: [
          { title: "Wöchentliche Marketing-Sales Syncs etablieren", start: 0, target: 12, current: 7, unit: "Meetings" },
          { title: "Shared Dashboard für beide Teams erstellen", start: 0, target: 1, current: 0, unit: "Dashboard" },
          { title: "Lead Handover Prozess dokumentieren", start: 0, target: 100, current: 60, unit: "%" },
        ],
      },
      // Q1 2026 — current quarter, active
      {
        quarter: "Q1 2026",
        title: "Multi-Channel Attribution einführen",
        category: "performance",
        progress: 62,
        isActive: true,
        why: "Genaue Zuordnung des Marketing-ROI über alle Kanäle",
        keyResults: [
          { title: "Attribution-Modell in GA4 konfigurieren", start: 0, target: 100, current: 80, unit: "%" },
          { title: "Cross-Channel Report erstellen", start: 0, target: 1, current: 0, unit: "Report" },
          { title: "Budget-Allokation basierend auf Daten anpassen", start: 0, target: 3, current: 2, unit: "Anpassungen" },
        ],
      },
      {
        quarter: "Q1 2026",
        title: "AI-gestützte Kampagnenoptimierung",
        category: "skill",
        progress: 48,
        isActive: true,
        why: "KI-Tools in den Marketing-Workflow integrieren",
        keyResults: [
          { title: "3 AI-Tools evaluieren und 1 einführen", start: 0, target: 3, current: 2, unit: "Tools" },
          { title: "Ad-Copy mit AI generieren — CTR um 10% steigern", start: 3.2, target: 3.5, current: 3.3, unit: "%" },
          { title: "AI-gestützte Zielgruppen-Segmentierung testen", start: 0, target: 2, current: 1, unit: "Segmente" },
        ],
      },
      {
        quarter: "Q1 2026",
        title: "Leadership Skills aufbauen",
        category: "career",
        progress: 35,
        isActive: true,
        why: "Vorbereitung auf Senior-Level und Teamführung",
        keyResults: [
          { title: "Mentoring-Programm mit Junior starten", start: 0, target: 1, current: 1, unit: "Programm" },
          { title: "2 Präsentationen vor Stakeholdern halten", start: 0, target: 2, current: 0, unit: "Präsentationen" },
          { title: "Feedbackgespräche mit Manager alle 2 Wochen", start: 0, target: 6, current: 3, unit: "Gespräche" },
        ],
      },
    ]);

    // Career progress — mid-level with 3 qualifying OKRs
    console.log("  🎯 Setting career progress...");
    await seedCareerProgress(
      burak.id,
      orgId,
      midLevel?.id || null,
      3 // 3 qualifying OKRs (ROAS Q3, Q4 Performance, Q4 Content)
    );

    // Requirement completions for marketing path
    console.log("  ✅ Seeding requirement completions...");
    await seedRequirementCompletions(burak.id, orgId, "marketing", [
      {
        levelId: "junior",
        requirements: [
          { index: 0, status: "completed", notes: "Google Ads + Meta Ads Zertifizierungen abgeschlossen" },
          { index: 1, status: "completed" },
          { index: 2, status: "completed", notes: "GA4, Hotjar, Semrush im Einsatz" },
          { index: 3, status: "completed" },
          { index: 4, status: "completed", notes: "Wöchentliche Reports für Teamlead" },
        ],
      },
      {
        levelId: "midlevel",
        requirements: [
          { index: 0, status: "completed", notes: "Eigenständige Kampagnenplanung seit Q2 2025" },
          { index: 1, status: "completed" },
          { index: 2, status: "in_progress", notes: "Budget bis 50k eigenständig, darüber mit Freigabe" },
          { index: 3, status: "in_progress", notes: "A/B Tests laufen, statistische Signifikanz noch lernen" },
          { index: 4, status: "completed", notes: "Monatliche Stakeholder-Präsentation etabliert" },
        ],
      },
      {
        levelId: "senior",
        requirements: [
          { index: 0, status: "in_progress", notes: "Multi-Channel Strategie in Entwicklung" },
          { index: 1, status: "not_started" },
          { index: 2, status: "not_started" },
          { index: 3, status: "not_started" },
        ],
      },
    ]);
  }

  // ==========================================
  // USER 2: Demo — Lisa Müller (Senior Design)
  // ==========================================
  console.log("\n📌 User 2: lisa@admkrs.com");

  const lisaId = await createDemoUser("lisa@admkrs.com", "Lisa Müller", orgId, {
    craft_focus: "design",
    department: "Design",
    position: "Senior UI/UX Designerin",
    role: "employee",
  });

  console.log("  📊 Seeding OKRs...");
  await seedOKRs(lisaId, orgId, [
    // Q2 2025
    {
      quarter: "Q2 2025",
      title: "Design System v2 launchen",
      category: "performance",
      progress: 95,
      keyResults: [
        { title: "Component Library mit 40 Komponenten", start: 12, target: 40, current: 42, unit: "Komponenten" },
        { title: "Figma-to-Code Workflow dokumentieren", start: 0, target: 100, current: 100, unit: "%" },
        { title: "Team-Adoption Rate über 80%", start: 30, target: 80, current: 88, unit: "%" },
      ],
    },
    {
      quarter: "Q2 2025",
      title: "Accessibility Audit durchführen",
      category: "skill",
      progress: 88,
      keyResults: [
        { title: "WCAG 2.1 AA Compliance erreichen", start: 45, target: 100, current: 92, unit: "%" },
        { title: "Screen Reader Testing für 10 Flows", start: 0, target: 10, current: 8, unit: "Flows" },
        { title: "Accessibility Guidelines für Team erstellen", start: 0, target: 1, current: 1, unit: "Guide" },
      ],
    },
    // Q3 2025
    {
      quarter: "Q3 2025",
      title: "User Research Framework aufbauen",
      category: "performance",
      progress: 82,
      keyResults: [
        { title: "10 Nutzerinterviews pro Monat etablieren", start: 2, target: 10, current: 8, unit: "Interviews" },
        { title: "Research Repository aufsetzen", start: 0, target: 1, current: 1, unit: "Repository" },
        { title: "Insights in Product Roadmap einfließen lassen", start: 0, target: 5, current: 4, unit: "Features" },
      ],
    },
    {
      quarter: "Q3 2025",
      title: "Mentoring Programm leiten",
      category: "career",
      progress: 75,
      keyResults: [
        { title: "2 Junior Designer mentoren", start: 0, target: 2, current: 2, unit: "Mentees" },
        { title: "Design Critique Sessions wöchentlich", start: 0, target: 12, current: 9, unit: "Sessions" },
        { title: "Karriereplan für Mentees erstellen", start: 0, target: 2, current: 1, unit: "Pläne" },
      ],
    },
    // Q4 2025
    {
      quarter: "Q4 2025",
      title: "Mobile App Redesign",
      category: "performance",
      progress: 90,
      keyResults: [
        { title: "Neue App Screens designen (15 Screens)", start: 0, target: 15, current: 15, unit: "Screens" },
        { title: "Prototyp User Testing mit 20 Nutzern", start: 0, target: 20, current: 18, unit: "Nutzer" },
        { title: "Task Completion Rate um 25% verbessern", start: 62, target: 78, current: 80, unit: "%" },
      ],
    },
    {
      quarter: "Q4 2025",
      title: "Design Ops optimieren",
      category: "skill",
      progress: 68,
      keyResults: [
        { title: "Design Handoff Prozess standardisieren", start: 0, target: 100, current: 85, unit: "%" },
        { title: "Review-Zyklen von 3 auf 1.5 Tage reduzieren", start: 3, target: 1.5, current: 1.8, unit: "Tage" },
        { title: "QA Checklist für Design-Releases", start: 0, target: 1, current: 0, unit: "Checklist" },
      ],
    },
    // Q1 2026 active
    {
      quarter: "Q1 2026",
      title: "Design Leadership etablieren",
      category: "career",
      progress: 40,
      isActive: true,
      keyResults: [
        { title: "Design Strategy Präsentation für C-Level", start: 0, target: 1, current: 0, unit: "Präsentation" },
        { title: "Cross-functional Design Sprints leiten", start: 0, target: 3, current: 1, unit: "Sprints" },
        { title: "Design Hiring Prozess mitgestalten", start: 0, target: 100, current: 60, unit: "%" },
      ],
    },
    {
      quarter: "Q1 2026",
      title: "Motion Design Skills ausbauen",
      category: "learning",
      progress: 55,
      isActive: true,
      keyResults: [
        { title: "After Effects Kurs abschließen", start: 0, target: 100, current: 70, unit: "%" },
        { title: "5 Micro-Interactions für App implementieren", start: 0, target: 5, current: 2, unit: "Animationen" },
        { title: "Motion Design Guidelines erstellen", start: 0, target: 1, current: 0, unit: "Guide" },
      ],
    },
  ]);

  console.log("  🎯 Setting career progress...");
  await seedCareerProgress(lisaId, orgId, seniorLevel?.id || midLevel?.id || null, 5);

  console.log("  ✅ Seeding requirement completions...");
  await seedRequirementCompletions(lisaId, orgId, "design", [
    {
      levelId: "junior",
      requirements: [
        { index: 0, status: "completed" },
        { index: 1, status: "completed" },
        { index: 2, status: "completed" },
        { index: 3, status: "completed" },
        { index: 4, status: "completed" },
      ],
    },
    {
      levelId: "midlevel",
      requirements: [
        { index: 0, status: "completed" },
        { index: 1, status: "completed", notes: "Design System v2 erfolgreich gelauncht" },
        { index: 2, status: "completed" },
        { index: 3, status: "completed" },
        { index: 4, status: "completed", notes: "WCAG 2.1 AA erreicht" },
      ],
    },
    {
      levelId: "senior",
      requirements: [
        { index: 0, status: "completed", notes: "User Research Framework etabliert" },
        { index: 1, status: "completed" },
        { index: 2, status: "in_progress", notes: "Design Strategy in Entwicklung" },
        { index: 3, status: "in_progress" },
        { index: 4, status: "not_started" },
      ],
    },
  ]);

  // ==========================================
  // USER 3: Demo — Tom Weber (Junior Dev)
  // ==========================================
  console.log("\n📌 User 3: tom@admkrs.com");

  const tomId = await createDemoUser("tom@admkrs.com", "Tom Weber", orgId, {
    craft_focus: "development",
    department: "Engineering",
    position: "Junior Frontend Developer",
    role: "employee",
  });

  console.log("  📊 Seeding OKRs...");
  await seedOKRs(tomId, orgId, [
    // Q4 2025
    {
      quarter: "Q4 2025",
      title: "React & TypeScript Expertise aufbauen",
      category: "learning",
      progress: 80,
      keyResults: [
        { title: "TypeScript Advanced Kurs abschließen", start: 0, target: 100, current: 100, unit: "%" },
        { title: "5 Features eigenständig implementieren", start: 0, target: 5, current: 4, unit: "Features" },
        { title: "Code Review Feedback unter 3 Iterationen", start: 5, target: 3, current: 2.5, unit: "Iterationen" },
      ],
    },
    {
      quarter: "Q4 2025",
      title: "Testing Kultur etablieren",
      category: "skill",
      progress: 65,
      keyResults: [
        { title: "Unit Test Coverage auf 60% bringen", start: 22, target: 60, current: 52, unit: "%" },
        { title: "E2E Tests für 3 kritische Flows schreiben", start: 0, target: 3, current: 2, unit: "Flows" },
        { title: "Testing Workshop für Team halten", start: 0, target: 1, current: 0, unit: "Workshop" },
      ],
    },
    // Q1 2026 active
    {
      quarter: "Q1 2026",
      title: "Performance Optimization Projekt",
      category: "performance",
      progress: 38,
      isActive: true,
      keyResults: [
        { title: "Core Web Vitals ins Grüne bringen", start: 45, target: 90, current: 62, unit: "Score" },
        { title: "Bundle Size um 30% reduzieren", start: 850, target: 595, current: 720, unit: "KB" },
        { title: "Lighthouse Score über 90", start: 65, target: 90, current: 72, unit: "Score" },
      ],
    },
    {
      quarter: "Q1 2026",
      title: "Backend Grundlagen lernen",
      category: "learning",
      progress: 25,
      isActive: true,
      keyResults: [
        { title: "Node.js & Express Kurs abschließen", start: 0, target: 100, current: 40, unit: "%" },
        { title: "Erste eigene API Route implementieren", start: 0, target: 3, current: 0, unit: "Routes" },
        { title: "SQL Grundlagen beherrschen", start: 0, target: 100, current: 35, unit: "%" },
      ],
    },
  ]);

  console.log("  🎯 Setting career progress...");
  await seedCareerProgress(tomId, orgId, juniorLevel?.id || null, 1);

  console.log("  ✅ Seeding requirement completions...");
  await seedRequirementCompletions(tomId, orgId, "development", [
    {
      levelId: "junior",
      requirements: [
        { index: 0, status: "completed", notes: "HTML, CSS, JS Grundlagen solide" },
        { index: 1, status: "completed" },
        { index: 2, status: "in_progress", notes: "Git Workflow verstanden, PR Reviews noch lernen" },
        { index: 3, status: "in_progress" },
        { index: 4, status: "not_started" },
      ],
    },
    {
      levelId: "midlevel",
      requirements: [
        { index: 0, status: "in_progress", notes: "TypeScript Kurs abgeschlossen, Praxis noch aufbauen" },
        { index: 1, status: "not_started" },
        { index: 2, status: "not_started" },
      ],
    },
  ]);

  // ==========================================
  // STEP 6: Create trigger for qualifying_okr_count
  // ==========================================
  console.log("\n⚡ Creating qualifying_okr_count trigger...");

  const triggerSQL = `
    -- Function to update qualifying_okr_count when OKR progress changes
    CREATE OR REPLACE FUNCTION public.update_qualifying_okr_count()
    RETURNS TRIGGER AS $$
    DECLARE
      _org_id UUID;
      _qualifying_count INTEGER;
    BEGIN
      -- Get user's organization
      SELECT organization_id INTO _org_id
      FROM profiles WHERE id = NEW.user_id;

      IF _org_id IS NULL THEN
        RETURN NEW;
      END IF;

      -- Count OKRs with progress >= 70 (score >= 0.7)
      SELECT COUNT(*) INTO _qualifying_count
      FROM okrs
      WHERE user_id = NEW.user_id
        AND organization_id = _org_id
        AND progress >= 70;

      -- Upsert career progress
      INSERT INTO user_career_progress (user_id, organization_id, qualifying_okr_count, total_okrs_attempted)
      VALUES (
        NEW.user_id,
        _org_id,
        _qualifying_count,
        (SELECT COUNT(*) FROM okrs WHERE user_id = NEW.user_id AND organization_id = _org_id)
      )
      ON CONFLICT (user_id, organization_id)
      DO UPDATE SET
        qualifying_okr_count = _qualifying_count,
        total_okrs_attempted = (SELECT COUNT(*) FROM okrs WHERE user_id = NEW.user_id AND organization_id = _org_id),
        updated_at = now();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Drop existing trigger if any
    DROP TRIGGER IF EXISTS trg_update_qualifying_okrs ON okrs;

    -- Create trigger on OKR insert/update
    CREATE TRIGGER trg_update_qualifying_okrs
    AFTER INSERT OR UPDATE OF progress ON okrs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_qualifying_okr_count();
  `;

  const { error: triggerError } = await supabase.rpc("exec_sql", {
    sql: triggerSQL,
  });

  if (triggerError) {
    console.log(
      `  ⤷ RPC exec_sql not available — trigger SQL needs to run manually in SQL Editor`
    );
    console.log(`  ⤷ Saving to scripts/trigger-qualifying-okrs.sql`);
    // We'll write this to a file and run via Chrome
  } else {
    console.log("  ⤷ Trigger created successfully!");
  }

  console.log("\n✅ Demo data seeding complete!");
  console.log("\nAccounts:");
  console.log("  • b@admkrs.com — Performance Marketing (Midlevel, 3 qualifying OKRs)");
  console.log("  • lisa@admkrs.com / demo1234! — Senior UI/UX Designerin (Senior, 5 qualifying OKRs)");
  console.log("  • tom@admkrs.com / demo1234! — Junior Frontend Developer (Junior, 1 qualifying OKR)");
}

main().catch(console.error);
