// ADMKRS Karrierepfade — extracted from official career paths document
// Salary information intentionally excluded

export interface CareerPathLevel {
  id: string;
  name: string;
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  aiIntegration: string[];
  skills?: string[];
}

export interface CareerPath {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string; // lucide icon name
  levels: CareerPathLevel[];
}

// ─── Shared level structure ────────────────────────────────────────────

const LEVEL_IDS = [
  "trainee",
  "junior",
  "midlevel",
  "senior",
  "lead",
  "head",
] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

// ─── 1. Performance Marketing Manager ──────────────────────────────────

const performanceMarketing: CareerPath = {
  id: "performance_marketing",
  name: "Performance Marketing Manager",
  shortName: "Performance Marketing",
  description:
    "Analytisches Denken und strategisches Verständnis für messbare Ergebnisse auf Meta, Google und TikTok.",
  icon: "BarChart3",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description:
        "Einstieg mit strukturiertem Onboarding im Performance Marketing.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Marketing, Medien, Wirtschaft o.ä.)",
        "Erste Erfahrungen mit digitalen Marketingkanälen",
        "Grundkenntnisse in Meta, Google oder TikTok Ads",
        "Analytisches Denkvermögen und Datenaffinität",
        "Erste Erfahrungen mit Excel/Google Sheets",
      ],
      responsibilities: [
        "Unterstützung bei Kampagnenplanung und -umsetzung",
        "Datenerfassung und einfache Analysen für Reports",
        "Recherche zu Trends, Best Practices und Wettbewerbern",
        "Erlernen der Plattformspezifika (Meta, Google, TikTok)",
      ],
      aiIntegration: [
        "Erlernen grundlegender KI-Tools für Datenanalyse und Reporting",
        "Verständnis für die Rolle von KI in Performance-Marketing-Prozessen",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description:
        "Eigenständige Kampagnenarbeit mit ersten Kundenberührungspunkten.",
      requirements: [
        "1-3 Jahre Berufserfahrung im digitalen Marketing",
        "Grundkenntnisse in Performance Marketing auf Meta, Google und/oder TikTok",
        "Verständnis von Customer Journey, Conversion-Optimierung und Attribution",
        "Erste Erfahrungen mit Kampagnenplanung und -umsetzung",
        "Fähigkeit zur Analyse von Performance-Daten",
      ],
      responsibilities: [
        "Eigenständige Planung und Umsetzung kleinerer Kampagnen",
        "Monitoring und Optimierung von Kampagnen-Performance",
        "Erstellung von Performance-Reports und Handlungsempfehlungen",
        "Selbstständige Verwaltung kleinerer Werbebudgets",
        "Zusammenarbeit mit dem Creative Team",
      ],
      aiIntegration: [
        "Aktive Nutzung von KI-Tools für Kampagnenoptimierung und Reporting",
        "Anwendung von KI für Zielgruppenanalysen und Audience-Erstellung",
        "Nutzung von KI-gestützten Prognosemodellen",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Kampagnensteuerung mit wachsender Kundenverantwortung.",
      requirements: [
        "3-5 Jahre Berufserfahrung im Performance Marketing",
        "Vertiefte Kenntnisse in mind. 2 Plattformen (Meta, Google, TikTok)",
        "Erfahrung mit A/B-Testing, CRO und Attribution",
        "Verwaltung mittlerer Werbebudgets",
        "Entwicklung kanalübergreifender Strategien",
      ],
      responsibilities: [
        "Eigenverantwortliche Planung, Umsetzung und Optimierung von Kampagnen",
        "Budget-Management und Performance-Tracking für mehrere Kunden",
        "Entwicklung kanalspezifischer Strategien und Taktiken",
        "Mentoring von Trainees und Junior-Mitarbeitern",
        "Entwicklung und Implementierung von Testing-Frameworks",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener KI-Lösungen für Kampagnenoptimierung",
        "Entwicklung von KI-gestützten Workflows zur Effizienzsteigerung",
        "Training von Teammitgliedern in KI-Tools",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Expertenwissen mit strategischer Beratung und Teamführung.",
      requirements: [
        "5-7 Jahre Berufserfahrung im Performance Marketing",
        "Expertenwissen in allen relevanten Plattformen (Meta, Google, TikTok)",
        "Tiefgreifendes Verständnis von Marketing-Technologien und Attribution",
        "Erfahrung in der Entwicklung umfassender Marketingstrategien",
        "Nachgewiesene Erfolge in der Performance-Optimierung",
      ],
      responsibilities: [
        "Entwicklung komplexer Performance-Marketing-Strategien",
        "Optimierung des Kanal-Mix und der Customer Journey",
        "Führung und Entwicklung von Junior- und Midlevel-Mitarbeitern",
        "Aktive Beteiligung an Pitches und Neukundengewinnung",
        "Beratung von Kunden auf strategischer Ebene",
      ],
      aiIntegration: [
        "Strategische Integration von KI in alle Performance-Marketing-Prozesse",
        "Entwicklung von KI-gestützten Prognose- und Optimierungsmodellen",
        "Identifikation neuer KI-Technologien und deren Anwendungsmöglichkeiten",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description: "Teamleitung mit strategischer Verantwortung für den Bereich.",
      requirements: [
        "7-9 Jahre Berufserfahrung im Performance Marketing",
        "Umfassende Expertise in allen relevanten Kanälen und Technologien",
        "Nachgewiesene Erfolge in der Strategieentwicklung",
        "Starke Führungsqualitäten und Teammanagement-Erfahrung",
        "Tiefes Verständnis der Geschäftsmodelle von D2C- und FMCG-Marken",
      ],
      responsibilities: [
        "Leitung eines Teams von Performance Marketing Managern",
        "Entwicklung übergreifender Strategien für mehrere Kunden",
        "Verantwortung für Umsatz- und Wachstumsziele",
        "Qualitätssicherung und kontinuierliche Prozessoptimierung",
        "Strategische Beratung auf C-Level",
      ],
      aiIntegration: [
        "Entwicklung einer KI-Strategie für das Performance Marketing Team",
        "Förderung einer KI-first Denkweise im Team",
        "Evaluation und Einführung neuer KI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Director",
      experience: "9+ Jahre",
      description:
        "Gesamtverantwortung für die Performance Marketing Abteilung.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Marktverständnis",
        "Umfassende Erfahrung im Management von Teams und Budgets",
        "Exzellente Netzwerkfähigkeiten und Branchenkenntnis",
        "Nachgewiesene Erfolge in der Geschäftsentwicklung",
      ],
      responsibilities: [
        "Gesamtverantwortung für die Performance Marketing Abteilung",
        "Strategische Ausrichtung und Positionierung",
        "Personalverantwortung und Teamaufbau",
        "Repräsentation der Agentur nach außen",
        "Verantwortung für die Profitabilität der Abteilung",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als KI-getriebener Performance Marketing Partner",
        "Entwicklung proprietärer KI-Lösungen als Wettbewerbsvorteil",
        "Positionierung als Thought Leader im Bereich KI-gestütztes Performance Marketing",
      ],
    },
  ],
};

// ─── 2. Creative Strategist/Concepter ──────────────────────────────────

const creativeStrategist: CareerPath = {
  id: "creative_strategist",
  name: "Creative Strategist / Concepter",
  shortName: "Creative Strategy",
  description:
    "Strategische Konzeption kreativer Lösungen für wirkungsvolle Kampagnen.",
  icon: "Lightbulb",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in kreative Prozesse und strategische Konzeption.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Kommunikation, Marketing, Design o.ä.)",
        "Erste Erfahrungen mit kreativen Prozessen",
        "Grundlegendes Verständnis von Markenidentität und Zielgruppenansprache",
        "Kreatives Denkvermögen und visuelle Kommunikationsfähigkeit",
        "Grundkenntnisse in Social-Media-Plattformen und aktuellen Trends",
      ],
      responsibilities: [
        "Unterstützung bei der Entwicklung kreativer Konzepte",
        "Recherche zu Trends, Wettbewerbern und Zielgruppen",
        "Mitarbeit bei Brainstorming-Sessions und Ideenfindung",
        "Unterstützung bei der Erstellung von Creative Briefs",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für Kreativprozesse",
        "Unterstützung bei AI-gestützter Trend-Recherche",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description:
        "Erste eigenständige Konzepte und Kreativstrategie-Beiträge.",
      requirements: [
        "1-3 Jahre Berufserfahrung im Bereich Kreation oder Strategie",
        "Grundkenntnisse in Konzeptentwicklung und Storytelling",
        "Verständnis von Markenidentität und Zielgruppenansprache",
        "Aktives Verständnis aktueller Social-Media-Trends",
      ],
      responsibilities: [
        "Entwicklung kreativer Konzepte für einzelne Kanäle",
        "Erstellung von Konzeptpräsentationen und Creative Briefs",
        "Zusammenarbeit mit dem Performance-Team",
        "Identifikation relevanter Trends für Marken und Kampagnen",
      ],
      aiIntegration: [
        "Aktive Nutzung von AI-Tools für Konzeptentwicklung und Trend-Analyse",
        "Anwendung von AI für Zielgruppenanalysen und Insights",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Kreativkonzeption mit Kundenverantwortung.",
      requirements: [
        "3-5 Jahre Berufserfahrung in Creative Strategy",
        "Vertiefte Kenntnisse in Konzeptentwicklung und Content-Strategie",
        "Erfahrung mit verschiedenen Kreativformaten für Performance-Marketing",
        "Tiefes Verständnis aktueller Social-Media-Trends",
      ],
      responsibilities: [
        "Eigenverantwortliche Entwicklung von Kreativkonzepten und Content-Strategien",
        "Erstellung umfassender Creative Briefs für Umsetzungsteams",
        "Mentoring von Trainees und Junior-Mitarbeitern",
        "Präzise Ressourcenplanung für die Umsetzung von Konzepten",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener AI-Lösungen für Konzeptentwicklung",
        "Entwicklung von AI-gestützten Workflows zur Effizienzsteigerung",
        "Training von Teammitgliedern in AI-Tools für Kreativprozesse",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Strategische Kreativführung mit Kundenberatung auf hohem Niveau.",
      requirements: [
        "5-7 Jahre Berufserfahrung in Creative Strategy oder Content-Entwicklung",
        "Expertenwissen in Konzeptentwicklung, Storytelling und Markenführung",
        "Tiefgreifendes Verständnis von Zielgruppenpsychologie",
        "Führende Expertise in Social-Media-Trends",
      ],
      responsibilities: [
        "Entwicklung komplexer Kreativstrategien entlang des Funnels",
        "Führung und Entwicklung von Junior- und Midlevel-Mitarbeitern",
        "Aktive Beteiligung an Pitches und Neukundengewinnung",
        "Strategische Beratung auf Kundenebene",
        "Etablierung von Best Practices für kreative Konzeption",
      ],
      aiIntegration: [
        "Strategische Integration von AI in kreative Konzeptionsprozesse",
        "Entwicklung von AI-gestützten Kreativstrategien",
        "Identifikation neuer AI-Technologien für kreative Anwendungen",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description:
        "Leitung des Creative Strategy Teams mit abteilungsübergreifender Wirkung.",
      requirements: [
        "7-9 Jahre Berufserfahrung in Creative Strategy",
        "Umfassende Expertise in Kreativkonzeption und Strategieentwicklung",
        "Starke Führungsqualitäten und Teammanagement-Erfahrung",
        "Visionäres Verständnis für Social-Media-Trends",
      ],
      responsibilities: [
        "Leitung eines Teams von Creative Strategists",
        "Entwicklung übergreifender Kreativstrategien",
        "Verantwortung für kreative Exzellenz und Innovation",
        "Strategische Beratung auf C-Level",
        "Strategische Ressourcenplanung auf Abteilungsebene",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für das Creative Strategy Team",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Creative Director",
      experience: "9+ Jahre",
      description:
        "Gesamtverantwortung für die kreative Ausrichtung der Agentur.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Verständnis der Kreativ- und Medienlandschaft",
        "Umfassende Erfahrung im Management von kreativen Teams",
        "Nachgewiesene Erfolge in preisgekrönter Kreativkonzeption",
      ],
      responsibilities: [
        "Gesamtverantwortung für die Creative Strategy Abteilung",
        "Entwicklung der kreativen Ausrichtung und Positionierung der Agentur",
        "Personalverantwortung und Teamaufbau",
        "Repräsentation nach außen (Konferenzen, Publikationen, Awards)",
        "Verantwortung für kreative Qualität und Innovationskraft",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als AI-getriebener kreativer Partner",
        "Entwicklung proprietärer AI-Lösungen für kreative Prozesse",
        "Positionierung als Thought Leader im Bereich AI-gestützte Kreativkonzeption",
      ],
    },
  ],
};

// ─── 3. Grafikdesigner ─────────────────────────────────────────────────

const grafikdesigner: CareerPath = {
  id: "graphic_design",
  name: "Grafikdesigner",
  shortName: "Grafikdesign",
  description:
    "Visuelle Gestaltung von Marketingmaterialien mit Fokus auf UI/UX, Branding und Social Media.",
  icon: "Palette",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in Design-Tools und Agenturprozesse.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Grafikdesign, Kommunikationsdesign o.ä.)",
        "Erste Erfahrungen mit Adobe Creative Suite",
        "Grundlegendes Verständnis von Designprinzipien",
        "Grundkenntnisse in UI/UX, Branding oder Social Media Design",
      ],
      responsibilities: [
        "Unterstützung bei der Erstellung einfacher Designelemente",
        "Erlernen der Agenturprozesse und Designstandards",
        "Unterstützung bei Social Media Assets",
        "Erlernen der Nutzung von ClickUp für Designprojekte",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für Designprozesse",
        "Verständnis für die Rolle von AI in Designprozessen",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description: "Eigenständige Designerstellung für verschiedene Kanäle.",
      requirements: [
        "1-3 Jahre Berufserfahrung im Grafikdesign",
        "Gute Kenntnisse der Adobe Creative Suite (Photoshop, Illustrator, InDesign)",
        "Grundkenntnisse in UI/UX-Design, Branding und Social Media Design",
        "Verständnis für Performance-Marketing-Anforderungen an Designs",
      ],
      responsibilities: [
        "Eigenständige Erstellung von Designs für verschiedene Kanäle",
        "Erstellung von Social Media Assets und Werbemitteln",
        "Mitarbeit bei UI/UX-Projekten und Branding-Aufgaben",
        "Einhaltung von Designstandards und Brand Guidelines",
      ],
      aiIntegration: [
        "Aktive Nutzung von AI-Tools für Designprozesse und Bildbearbeitung",
        "Anwendung von AI für schnelle Erstellung von Designvarianten",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Gestaltung komplexer Designprojekte.",
      requirements: [
        "3-5 Jahre Berufserfahrung im Grafikdesign",
        "Vertiefte Kenntnisse in UI/UX-Design, Branding und Social Media Design",
        "Erfahrung mit Designs für Performance Marketing",
        "Fähigkeit, komplexe Designprojekte eigenständig umzusetzen",
      ],
      responsibilities: [
        "Eigenverantwortliche Gestaltung komplexer Designprojekte",
        "Entwicklung von UI/UX-Konzepten und Branding-Elementen",
        "Performance-optimierte Designs für verschiedene Kanäle",
        "Mentoring von Trainees und Junior-Designern",
        "Optimierung von Designprozessen für mehr Effizienz",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener AI-Lösungen für Designprozesse",
        "Entwicklung von AI-gestützten Workflows",
        "Training von Teammitgliedern in AI-Tools für Design",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Designexperte mit Projektleitung und strategischer Beratung.",
      requirements: [
        "5-7 Jahre Berufserfahrung im Grafikdesign",
        "Expertenwissen in UI/UX-Design, Branding und Social Media Design",
        "Erfahrung in der Leitung von Designprojekten",
        "Nachgewiesene Erfolge in der Entwicklung erfolgreicher Designs",
      ],
      responsibilities: [
        "Entwicklung komplexer Designkonzepte",
        "Leitung wichtiger Designprojekte und -initiativen",
        "Führung und Entwicklung von Junior- und Midlevel-Designern",
        "Aktive Beteiligung an Pitches und Neukundengewinnung",
        "Etablierung von Designstandards und Best Practices",
      ],
      aiIntegration: [
        "Strategische Integration von AI in Designprozesse",
        "Entwicklung von AI-gestützten Designsystemen",
        "Identifikation neuer AI-Technologien für Designanwendungen",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description: "Leitung des Designteams mit strategischer Verantwortung.",
      requirements: [
        "7-9 Jahre Berufserfahrung im Grafikdesign",
        "Umfassende Expertise in allen relevanten Designbereichen",
        "Starke Führungsqualitäten und Teammanagement-Erfahrung",
        "Tiefes Verständnis der Designanforderungen für D2C und FMCG Brands",
      ],
      responsibilities: [
        "Leitung eines Teams von Grafikdesignern",
        "Entwicklung übergreifender Designstrategien",
        "Verantwortung für Designqualität und -effizienz",
        "Strategische Beratung auf C-Level in Designfragen",
        "Förderung von Innovation und Kreativität im Team",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für das Designteam",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Design Director",
      experience: "9+ Jahre",
      description: "Gesamtverantwortung für die Designabteilung.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Verständnis der Designlandschaft",
        "Umfassende Erfahrung im Management von Designteams",
        "Nachgewiesene Erfolge in preisgekröntem Design",
      ],
      responsibilities: [
        "Gesamtverantwortung für die Designabteilung",
        "Entwicklung der strategischen Ausrichtung und Positionierung",
        "Personalverantwortung und Teamaufbau",
        "Repräsentation nach außen (Konferenzen, Awards)",
        "Verantwortung für Designqualität und Innovationskraft",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als AI-getriebener Designpartner",
        "Entwicklung proprietärer AI-Lösungen für Designprozesse",
        "Positionierung als Thought Leader im Bereich AI-gestütztes Design",
      ],
    },
  ],
};

// ─── 4. Projektmanager ─────────────────────────────────────────────────

const projektmanager: CareerPath = {
  id: "project_management",
  name: "Projektmanager",
  shortName: "Projektmanagement",
  description:
    "Effiziente Planung, Koordination und Durchführung von Projekten.",
  icon: "FolderKanban",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in Projektmanagement-Methoden und -Tools.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Projektmanagement, Wirtschaft o.ä.)",
        "Erste Erfahrungen mit Projektarbeit",
        "Grundlegendes Verständnis von PM-Methoden",
        "Organisationstalent und strukturierte Arbeitsweise",
      ],
      responsibilities: [
        "Unterstützung bei Planung und Organisation von Projekten",
        "Mitarbeit bei Projektplänen und Zeitlinien",
        "Protokollführung und Dokumentation",
        "Erlernen der Nutzung von ClickUp und anderen PM-Tools",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für das Projektmanagement",
        "Verständnis für die Rolle von AI in PM-Prozessen",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description: "Eigenständige Koordination kleinerer Projekte.",
      requirements: [
        "1-3 Jahre Berufserfahrung im Projektmanagement",
        "Grundkenntnisse in PM-Methoden und -Tools",
        "Verständnis von Agenturprozessen und Kundenanforderungen",
        "Sicherer Umgang mit ClickUp",
      ],
      responsibilities: [
        "Eigenständige Planung und Koordination kleinerer Projekte",
        "Erstellung von Projektplänen und Zeitlinien",
        "Monitoring von Projektfortschritten",
        "Koordination zwischen Performance Marketing und Creative Teams",
      ],
      aiIntegration: [
        "Aktive Nutzung von AI-Tools für Projektplanung und -management",
        "Anwendung von AI für Ressourcenplanung und Zeitmanagement",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Leitung mittlerer Projekte mit Budgetkontrolle.",
      requirements: [
        "3-5 Jahre Berufserfahrung im Projektmanagement",
        "Vertiefte Kenntnisse in PM-Methoden und -Tools",
        "Erfahrung mit der Leitung mittlerer Projekte",
        "Erfahrung in Ressourcenplanung und Budgetkontrolle",
      ],
      responsibilities: [
        "Eigenverantwortliche Planung und Leitung mittlerer Projekte",
        "Entwicklung und Optimierung von Projektplänen und -prozessen",
        "Ressourcenplanung und Budgetkontrolle",
        "Mentoring von Trainees und Junior-Mitarbeitern",
        "Identifikation und Lösung von Projektrisiken",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener AI-Lösungen für PM",
        "Entwicklung von AI-gestützten Workflows zur Effizienzsteigerung",
        "Training von Teammitgliedern in AI-Tools",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Leitung komplexer Projekte mit strategischer Kundenberatung.",
      requirements: [
        "5-7 Jahre Berufserfahrung im Projektmanagement",
        "Expertenwissen in PM-Methoden und -Tools",
        "Erfahrung in der Leitung komplexer Projekte und Kampagnen",
        "Nachgewiesene Erfolge in der Prozessoptimierung",
      ],
      responsibilities: [
        "Entwicklung komplexer Projektstrategien",
        "Leitung großer und strategisch wichtiger Projekte",
        "Führung und Entwicklung von Junior- und Midlevel-Mitarbeitern",
        "Beratung von Kunden auf strategischer Ebene",
        "Verantwortung für die Profitabilität von Projekten",
      ],
      aiIntegration: [
        "Strategische Integration von AI in alle PM-Prozesse",
        "Entwicklung von AI-gestützten Prognose- und Optimierungsmodellen",
        "Identifikation neuer AI-Technologien",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description: "Leitung des PM-Teams mit übergreifender Prozessverantwortung.",
      requirements: [
        "7-9 Jahre Berufserfahrung im Projektmanagement",
        "Umfassende Expertise in PM-Methoden und -Tools",
        "Nachgewiesene Erfolge in der Leitung komplexer Projekte und Teams",
        "Starke Führungsqualitäten",
      ],
      responsibilities: [
        "Leitung eines Teams von Projektmanagern",
        "Entwicklung übergreifender PM-Strategien",
        "Verantwortung für Profitabilität und Effizienz aller Projekte",
        "Strategische Beratung auf C-Level",
        "Implementierung von AI-gestützten PM-Prozessen",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für das PM-Team",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Director",
      experience: "9+ Jahre",
      description:
        "Gesamtverantwortung für die Projektmanagement-Abteilung.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Verständnis der Agenturlandschaft",
        "Umfassende Erfahrung im Management von Teams und Budgets",
        "Nachgewiesene Erfolge in der Geschäftsentwicklung",
      ],
      responsibilities: [
        "Gesamtverantwortung für die PM-Abteilung",
        "Strategische Ausrichtung und Positionierung",
        "Personalverantwortung und Teamaufbau",
        "Budget- und Ressourcenplanung",
        "Verantwortung für die Profitabilität und Effizienz der Agentur",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als AI-getriebener PM-Partner",
        "Entwicklung proprietärer AI-Lösungen für das Projektmanagement",
        "Positionierung als Thought Leader im Bereich AI-gestütztes PM",
      ],
    },
  ],
};

// ─── 5. Motion Designer ────────────────────────────────────────────────

const motionDesigner: CareerPath = {
  id: "motion_design",
  name: "Motion Designer",
  shortName: "Motion Design",
  description:
    "Erstellung von animierten Inhalten und bewegten Grafiken mit Fokus auf 2D-Animation.",
  icon: "Clapperboard",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in Motion Design-Tools und Animationsprinzipien.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Motion Design, Animation o.ä.)",
        "Erste Erfahrungen mit Adobe After Effects",
        "Grundlegendes Verständnis von Animation und Bewegungsprinzipien",
        "Grundkenntnisse in 2D-Animation",
      ],
      responsibilities: [
        "Unterstützung bei einfachen Animationen",
        "Erlernen der Motion Design-Standards",
        "Unterstützung bei animierten Social Media Assets",
        "Erlernen von After Effects und relevanten Tools",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für Motion Design",
        "Verständnis für die Rolle von AI in Motion Design-Prozessen",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description:
        "Eigenständige Erstellung von 2D-Animationen für verschiedene Kanäle.",
      requirements: [
        "1-3 Jahre Berufserfahrung im Motion Design",
        "Gute Kenntnisse in Adobe After Effects",
        "Grundkenntnisse in 2D-Animation und After Effects 3D",
        "Verständnis für Performance-Marketing-Anforderungen",
      ],
      responsibilities: [
        "Eigenständige Erstellung von 2D-Animationen",
        "Umsetzung von Motion Design-Konzepten nach Briefing",
        "Erstellung animierter Social Media Assets und Werbemittel",
        "Einhaltung von Motion Design-Standards und Brand Guidelines",
      ],
      aiIntegration: [
        "Aktive Nutzung von AI-Tools für Motion Design",
        "Anwendung von AI für schnelle Erstellung von Animationsvarianten",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Gestaltung komplexer Motion Design-Projekte.",
      requirements: [
        "3-5 Jahre Berufserfahrung im Motion Design",
        "Vertiefte Kenntnisse in 2D-Animation und After Effects 3D",
        "Erfahrung mit Animationen für Performance Marketing",
        "Fähigkeit, komplexe Motion Design-Projekte eigenständig umzusetzen",
      ],
      responsibilities: [
        "Eigenverantwortliche Gestaltung komplexer Motion Design-Projekte",
        "Entwicklung von Animation-Konzepten und deren Umsetzung",
        "Performance-optimierte Animationen für verschiedene Kanäle",
        "Mentoring von Trainees und Junior Motion Designern",
        "Optimierung von Motion Design-Prozessen",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener AI-Lösungen für Motion Design",
        "Entwicklung von AI-gestützten Workflows",
        "Training von Teammitgliedern in AI-Tools für Motion Design",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Motion Design-Experte mit Projektleitung und strategischer Beratung.",
      requirements: [
        "5-7 Jahre Berufserfahrung im Motion Design",
        "Expertenwissen in 2D-Animation und fortgeschrittene After Effects 3D-Kenntnisse",
        "Erfahrung in der Leitung von Motion Design-Projekten",
        "Nachgewiesene Erfolge in der Entwicklung erfolgreicher Animationen",
      ],
      responsibilities: [
        "Entwicklung komplexer Motion Design-Konzepte",
        "Leitung wichtiger Motion Design-Projekte",
        "Führung und Entwicklung von Junior- und Midlevel-Designern",
        "Aktive Beteiligung an Pitches und Neukundengewinnung",
        "Etablierung von Motion Design-Standards und Best Practices",
      ],
      aiIntegration: [
        "Strategische Integration von AI in Motion Design-Prozesse",
        "Entwicklung von AI-gestützten Animation-Systemen",
        "Identifikation neuer AI-Technologien für Motion Design",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description: "Leitung des Motion Design-Teams.",
      requirements: [
        "7-9 Jahre Berufserfahrung im Motion Design",
        "Umfassende Expertise in 2D-Animation und After Effects 3D",
        "Starke Führungsqualitäten und Teammanagement-Erfahrung",
        "Tiefes Verständnis der Motion Design-Anforderungen für D2C und FMCG",
      ],
      responsibilities: [
        "Leitung eines Teams von Motion Designern",
        "Entwicklung übergreifender Motion Design-Strategien",
        "Verantwortung für Motion Design-Qualität und -Effizienz",
        "Strategische Beratung auf C-Level in Motion Design-Fragen",
        "Förderung von Innovation und Kreativität im Team",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für das Motion Design-Team",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Motion Design Director",
      experience: "9+ Jahre",
      description: "Gesamtverantwortung für die Motion Design-Abteilung.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Verständnis der Motion Design-Landschaft",
        "Umfassende Erfahrung im Management von Motion Design-Teams",
        "Nachgewiesene Erfolge in preisgekrönten Animationen",
      ],
      responsibilities: [
        "Gesamtverantwortung für die Motion Design-Abteilung",
        "Strategische Ausrichtung und Positionierung",
        "Personalverantwortung und Teamaufbau",
        "Repräsentation nach außen (Konferenzen, Awards)",
        "Verantwortung für Motion Design-Qualität und Innovationskraft",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als AI-getriebener Motion Design-Partner",
        "Entwicklung proprietärer AI-Lösungen für Motion Design",
        "Positionierung als Thought Leader im Bereich AI-gestütztes Motion Design",
      ],
    },
  ],
};

// ─── 6. Video Editor ───────────────────────────────────────────────────

const videoEditor: CareerPath = {
  id: "video_editing",
  name: "Video Editor",
  shortName: "Video Editing",
  description:
    "Bearbeitung und Produktion von Videoinhalten: Anzeigen, Erklärvideos, Kurzform-Content.",
  icon: "Film",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in Video-Editing-Tools und Produktionsprozesse.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Mediengestaltung, Film o.ä.)",
        "Erste Erfahrungen mit Adobe Premiere Pro und After Effects",
        "Grundlegendes Verständnis von Videoproduktion",
        "Grundkenntnisse in der Erstellung von Social Media Content",
      ],
      responsibilities: [
        "Unterstützung bei einfachen Videoinhalten",
        "Erlernen der Video-Standards",
        "Unterstützung bei Social Media Videos",
        "Erlernen von Premiere Pro, After Effects und relevanten Tools",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für Video-Editing",
        "Verständnis für die Rolle von AI in Video-Produktionsprozessen",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description:
        "Eigenständige Videobearbeitung für verschiedene Kanäle.",
      requirements: [
        "1-3 Jahre Berufserfahrung im Video-Editing",
        "Gute Kenntnisse in Adobe Premiere Pro und After Effects",
        "Grundkenntnisse in Anzeigen, Social Media Content und Erklärvideos",
        "Erste Erfahrungen mit Kurzform-Inhalten",
      ],
      responsibilities: [
        "Eigenständige Bearbeitung von Videos für verschiedene Kanäle",
        "Produktion von Kurzform-Inhalten",
        "Gestaltung von designten Untertiteln",
        "Einhaltung von Video-Standards und Markenrichtlinien",
      ],
      aiIntegration: [
        "Aktive Nutzung von AI-Tools für Video-Editing",
        "Anwendung von AI für schnelle Erstellung von Video-Varianten",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenverantwortliche Gestaltung komplexer Videoprojekte.",
      requirements: [
        "3-5 Jahre Berufserfahrung im Video-Editing",
        "Vertiefte Kenntnisse in Anzeigen, Social Media Content und Erklärvideos",
        "Gutes Verständnis von Storytelling und Timing",
        "Fähigkeit, komplexe Video-Projekte eigenständig umzusetzen",
      ],
      responsibilities: [
        "Eigenverantwortliche Gestaltung komplexer Video-Projekte",
        "Erstellung von Anzeigen und Erklärvideos",
        "Produktion performance-optimierter Videos",
        "Mentoring von Trainees und Junior Video Editoren",
        "Optimierung von Video-Produktionsprozessen",
      ],
      aiIntegration: [
        "Implementierung fortgeschrittener AI-Lösungen für Video-Editing",
        "Entwicklung von AI-gestützten Workflows",
        "Training von Teammitgliedern in AI-Tools für Video-Editing",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-7 Jahre",
      description:
        "Video-Experte mit Projektleitung und strategischer Beratung.",
      requirements: [
        "5-7 Jahre Berufserfahrung im Video-Editing",
        "Expertenwissen in allen relevanten Videoformaten",
        "Erfahrung in der Leitung von Video-Projekten",
        "Nachgewiesene Erfolge in der Entwicklung erfolgreicher Videos",
      ],
      responsibilities: [
        "Entwicklung komplexer Video-Konzepte",
        "Leitung wichtiger Video-Projekte",
        "Führung und Entwicklung von Junior- und Midlevel Video Editoren",
        "Aktive Beteiligung an Pitches und Neukundengewinnung",
        "Etablierung von Video-Standards und Best Practices",
      ],
      aiIntegration: [
        "Strategische Integration von AI in Video-Editing-Prozesse",
        "Entwicklung von AI-gestützten Video-Produktionssystemen",
        "Identifikation neuer AI-Technologien für Video-Anwendungen",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "7-9 Jahre",
      description: "Leitung des Video-Teams.",
      requirements: [
        "7-9 Jahre Berufserfahrung im Video-Editing",
        "Umfassende Expertise in allen relevanten Video-Formaten",
        "Starke Führungsqualitäten und Teammanagement-Erfahrung",
        "Tiefes Verständnis der Video-Anforderungen für D2C und FMCG",
      ],
      responsibilities: [
        "Leitung eines Teams von Video Editoren",
        "Entwicklung übergreifender Video-Strategien",
        "Verantwortung für Video-Qualität und -Effizienz",
        "Strategische Beratung auf C-Level in Video-Fragen",
        "Förderung von Innovation und Kreativität im Team",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für das Video-Team",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien",
      ],
    },
    {
      id: "head",
      name: "Head / Video Director",
      experience: "9+ Jahre",
      description: "Gesamtverantwortung für die Video-Abteilung.",
      requirements: [
        "9+ Jahre Berufserfahrung, davon mehrere in Führungspositionen",
        "Strategische Vision und tiefes Verständnis der Video-Landschaft",
        "Umfassende Erfahrung im Management von Video-Teams",
        "Nachgewiesene Erfolge in preisgekrönten Videos",
      ],
      responsibilities: [
        "Gesamtverantwortung für die Video-Abteilung",
        "Strategische Ausrichtung und Positionierung",
        "Personalverantwortung und Teamaufbau",
        "Repräsentation nach außen (Konferenzen, Awards)",
        "Verantwortung für Video-Qualität und Innovationskraft",
      ],
      aiIntegration: [
        "Strategische Ausrichtung als AI-getriebener Video-Partner",
        "Entwicklung proprietärer AI-Lösungen für Video-Prozesse",
        "Positionierung als Thought Leader im Bereich AI-gestütztes Video-Editing",
      ],
    },
  ],
};

// ─── 7. Business Development Manager ───────────────────────────────────

const businessDevelopment: CareerPath = {
  id: "business_development",
  name: "Business Development Manager",
  shortName: "Business Development",
  description:
    "Vertrieb, Kundenakquise und strategische Partnerschaften für die Agentur.",
  icon: "Handshake",
  levels: [
    {
      id: "trainee",
      name: "Trainee",
      experience: "0-1 Jahre",
      description: "Einstieg in Vertriebsmethodik und Agenturleistungen.",
      requirements: [
        "Abgeschlossenes Studium/Ausbildung (Marketing, Vertrieb, Wirtschaft o.ä.)",
        "Erste Erfahrungen im Vertrieb oder Kundenservice",
        "Grundkenntnisse in Performance Marketing",
        "Sehr gute Kommunikationsfähigkeiten",
        "Hohe Lernbereitschaft und Eigeninitiative",
      ],
      responsibilities: [
        "Unterstützung des Vertriebsteams bei administrativen Aufgaben",
        "Recherche potenzieller Kunden und Marktanalysen",
        "Vorbereitung von Präsentationen und Angeboten",
        "Pflege des CRM-Systems und Dokumentation",
      ],
      aiIntegration: [
        "Erlernen grundlegender AI-Tools für Recherche und Analyse",
        "Verständnis für die Rolle von AI im Vertriebsprozess",
      ],
    },
    {
      id: "junior",
      name: "Junior",
      experience: "1-3 Jahre",
      description:
        "Eigenständige Betreuung kleinerer Bestandskunden und erste Akquise.",
      requirements: [
        "1-2 Jahre Erfahrung im Vertrieb oder Account Management",
        "Gutes Verständnis der Agenturleistungen im Performance Marketing",
        "Erste Erfolge in der Kundenbetreuung",
        "Sicheres Auftreten und gute Präsentationsfähigkeiten",
        "Eigenständige Arbeitsweise und Zielorientierung",
      ],
      responsibilities: [
        "Eigenständige Betreuung kleinerer Bestandskunden",
        "Unterstützung bei der Neukundenakquise",
        "Erstellung von Angeboten und Präsentationen",
        "Teilnahme an Kundengesprächen und Pitches",
        "Erreichung erster Umsatzziele",
      ],
      aiIntegration: [
        "Nutzung von AI-Tools für Kundenrecherche und Angebotsgestaltung",
        "Anwendung von AI für Vertriebsanalysen",
      ],
    },
    {
      id: "midlevel",
      name: "Midlevel",
      experience: "3-5 Jahre",
      description:
        "Eigenständige Akquise und Betreuung mittelgroßer Kunden.",
      requirements: [
        "3-5 Jahre Erfahrung im Vertrieb, idealerweise im Agenturumfeld",
        "Nachweisliche Erfolge in der Kundenakquise",
        "Umfassendes Verständnis der Performance Marketing Landschaft",
        "Ausgeprägte Verhandlungs- und Präsentationsfähigkeiten",
        "Strategisches Denken und analytische Fähigkeiten",
      ],
      responsibilities: [
        "Eigenständige Akquise und Betreuung mittelgroßer Kunden",
        "Entwicklung und Umsetzung von Vertriebsstrategien",
        "Erstellung komplexer Angebote und Vertragsverhandlungen",
        "Eigenverantwortliche Durchführung von Pitches",
        "Erreichung definierter Umsatz- und Akquiseziele",
      ],
      aiIntegration: [
        "Implementierung von AI-Tools für Vertriebsoptimierung",
        "Entwicklung von AI-gestützten Vertriebsprozessen",
        "Nutzung von AI für Wettbewerbsanalysen",
      ],
    },
    {
      id: "senior",
      name: "Senior",
      experience: "5-8 Jahre",
      description:
        "Akquise von Großkunden und strategische Account-Betreuung.",
      requirements: [
        "5-8 Jahre Erfahrung im B2B-Vertrieb, davon mind. 3 Jahre im Agenturumfeld",
        "Nachweisliche Erfolge bei der Gewinnung von Großkunden",
        "Exzellente Verhandlungs- und Präsentationsfähigkeiten",
        "Tiefes Verständnis der Performance Marketing Branche",
        "Ausgeprägte Netzwerkfähigkeiten und Branchenkontakte",
      ],
      responsibilities: [
        "Akquise und Betreuung von Großkunden und strategischen Accounts",
        "Entwicklung langfristiger Kundenbeziehungen",
        "Führung komplexer Vertragsverhandlungen und Pitches",
        "Mentoring von Junior und Midlevel Business Development Managern",
        "Verantwortung für signifikante Umsatzziele",
      ],
      aiIntegration: [
        "Strategische Integration von AI in Vertriebsprozesse",
        "Entwicklung von AI-gestützten Prognose- und Optimierungsmodellen",
        "Nutzung von AI für automatisierte Lead-Qualifizierung",
      ],
    },
    {
      id: "lead",
      name: "Lead",
      experience: "8-12 Jahre",
      description:
        "Führung des Vertriebsteams mit strategischer Marktverantwortung.",
      requirements: [
        "8-12 Jahre Erfahrung im B2B-Vertrieb, davon mind. 5 Jahre im Agenturumfeld",
        "Nachweisliche Erfolge in der Führung von Vertriebsteams",
        "Herausragende Verhandlungs- und Präsentationsfähigkeiten",
        "Umfassendes Verständnis des Marktes und der Wettbewerbslandschaft",
        "Starke Führungsqualitäten und Coaching-Fähigkeiten",
      ],
      responsibilities: [
        "Führung eines Vertriebsteams mit mehreren BDMs",
        "Entwicklung und Umsetzung der Vertriebsstrategie",
        "Verantwortung für die Erreichung der Teamumsatzziele",
        "Aufbau strategischer Partnerschaften und Allianzen",
        "Repräsentation bei wichtigen Branchenevents",
      ],
      aiIntegration: [
        "Entwicklung einer AI-Strategie für den Vertrieb",
        "Förderung einer AI-first Denkweise im Team",
        "Evaluation und Einführung neuer AI-Technologien im Vertrieb",
      ],
    },
    {
      id: "head",
      name: "Head / Director of Sales",
      experience: "12+ Jahre",
      description:
        "Gesamtverantwortung für den Vertriebsbereich und alle Vertriebsaktivitäten.",
      requirements: [
        "12+ Jahre Erfahrung im B2B-Vertrieb, davon mind. 5 Jahre in Führungspositionen",
        "Nachweisliche Erfolge in der strategischen Vertriebsleitung",
        "Exzellente Führungsqualitäten und Change Management",
        "Tiefes Marktverständnis und visionäres Denken",
        "Starkes Branchennetzwerk",
      ],
      responsibilities: [
        "Gesamtverantwortung für den Vertriebsbereich",
        "Entwicklung und Umsetzung der Vertriebsstrategie des Unternehmens",
        "Führung und Entwicklung des gesamten Vertriebsteams",
        "Gestaltung der Provisionsmodelle und Anreizsysteme",
        "Enge Zusammenarbeit mit der Geschäftsführung",
      ],
      aiIntegration: [
        "Strategische Ausrichtung des Vertriebs als AI-getrieben",
        "Entwicklung proprietärer AI-Lösungen für den Vertrieb",
        "Positionierung als Thought Leader im Bereich AI-gestützter Vertrieb",
      ],
    },
  ],
};

// ─── Export all paths ──────────────────────────────────────────────────

export const CAREER_PATHS: CareerPath[] = [
  performanceMarketing,
  creativeStrategist,
  grafikdesigner,
  projektmanager,
  motionDesigner,
  videoEditor,
  businessDevelopment,
];

export function getCareerPath(pathId: string): CareerPath | undefined {
  return CAREER_PATHS.find((p) => p.id === pathId);
}

export function getCareerLevel(
  pathId: string,
  levelId: string
): CareerPathLevel | undefined {
  const path = getCareerPath(pathId);
  return path?.levels.find((l) => l.id === levelId);
}

export function getNextLevel(
  pathId: string,
  currentLevelId: string
): CareerPathLevel | undefined {
  const path = getCareerPath(pathId);
  if (!path) return undefined;
  const currentIndex = path.levels.findIndex((l) => l.id === currentLevelId);
  if (currentIndex === -1 || currentIndex >= path.levels.length - 1)
    return undefined;
  return path.levels[currentIndex + 1];
}
