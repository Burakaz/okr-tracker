import type { AISuggestRequest } from "./types";

const CATEGORY_CONTEXT: Record<string, string> = {
  performance:
    "Performance-KPIs im Digital Marketing: ROAS, CPA, CPM, CTR, Conversion Rate, Impressionen, Reichweite, Umsatz, Leads, Engagement Rate, AOV, CAC, LTV, Bounce Rate, Session-Dauer.",
  skill:
    "Skill-Entwicklung: Zertifizierungen, Tool-Beherrschung (Meta Ads, Google Ads, TikTok Ads, Analytics, CRM), Workshops absolviert, neue Strategien getestet.",
  learning:
    "Weiterbildung: Kurse abgeschlossen, Bücher gelesen, Konferenzen besucht, interne Wissenstransfers gehalten, Blog-Posts geschrieben.",
  career:
    "Karriereentwicklung: Projekte geleitet, Teammitglieder betreut, Kundenpräsentationen gehalten, Cross-funktionale Zusammenarbeit, Verantwortungsbereiche erweitert.",
};

export function buildSystemPrompt(): string {
  return `Du bist ein KPI-Experte für eine Digital Marketing Agentur namens ADMKRS ("We Make Ads").
Das Team arbeitet mit OKRs (Objectives and Key Results).

Deine Aufgabe: Schlage messbare, realistische Key Results vor, die zum gegebenen OKR-Titel passen.

Regeln:
- Jedes Key Result MUSS einen numerischen start_value, target_value und eine unit haben
- Units sind IMMER auf Deutsch (z.B. "Prozent", "Euro", "Leads", "Stück", "Punkte")
- Die Werte müssen realistisch für ein Quartal sein
- Schlage 2-4 Key Results vor (nicht mehr, nicht weniger)
- Vermeide Duplikate zu bereits bestehenden Key Results
- Bevorzuge konkrete, messbare Metriken statt vager Formulierungen

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "suggestions": [
    { "title": "KR Titel", "start_value": 0, "target_value": 100, "unit": "Prozent" }
  ]
}`;
}

export function buildUserPrompt(request: AISuggestRequest): string {
  const categoryContext =
    CATEGORY_CONTEXT[request.category] || CATEGORY_CONTEXT.performance;

  let prompt = `OKR-Titel: "${request.okr_title}"
Kategorie: ${request.category}
Kontext: ${categoryContext}`;

  if (request.existing_krs && request.existing_krs.length > 0) {
    prompt += `\n\nBereits vorhandene Key Results (NICHT duplizieren):
${request.existing_krs.map((kr) => `- ${kr}`).join("\n")}`;
  }

  prompt += "\n\nSchlage passende Key Results vor:";
  return prompt;
}
