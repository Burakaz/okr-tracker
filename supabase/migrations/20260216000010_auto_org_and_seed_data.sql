-- Migration 10: Auto-Organization on Signup + Seed Data
-- Fixes "Profil nicht gefunden" by ensuring every user gets an organization_id

-- ============================================================
-- 1. Update handle_new_user() to auto-create or assign organization
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  user_domain TEXT;
BEGIN
  -- Extract domain from email
  user_domain := split_part(NEW.email, '@', 2);

  -- Try to find existing org matching the email domain
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE domain = user_domain
  LIMIT 1;

  -- If no org found by domain, use or create the default ADMKRS org
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id
    FROM public.organizations
    WHERE slug = 'admkrs'
    LIMIT 1;
  END IF;

  -- If still no org, create the default one
  IF default_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, domain)
    VALUES ('ADMKRS', 'admkrs', user_domain)
    RETURNING id INTO default_org_id;
  END IF;

  -- Create profile with organization assigned
  INSERT INTO public.profiles (id, email, name, avatar_url, organization_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    default_org_id,
    'employee'
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = COALESCE(EXCLUDED.organization_id, default_org_id),
    name = CASE WHEN profiles.name = '' OR profiles.name IS NULL
           THEN COALESCE(EXCLUDED.name, profiles.name)
           ELSE profiles.name END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Add domain column to organizations if not exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN domain TEXT;
  END IF;
END $$;

-- ============================================================
-- 3. Ensure default organization exists
-- ============================================================
INSERT INTO public.organizations (name, slug, domain)
VALUES ('ADMKRS', 'admkrs', 'admkrs.com')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = COALESCE(organizations.domain, EXCLUDED.domain);

-- ============================================================
-- 4. Fix all existing profiles that have NULL organization_id
-- ============================================================
UPDATE public.profiles
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'admkrs' LIMIT 1
)
WHERE organization_id IS NULL;

-- ============================================================
-- 5. Seed: Example Courses for the Learning Hub
-- ============================================================
DO $$
DECLARE
  org_id UUID;
  c_id UUID;
BEGIN
  -- Get the ADMKRS org
  SELECT id INTO org_id FROM public.organizations WHERE slug = 'admkrs' LIMIT 1;
  IF org_id IS NULL THEN RETURN; END IF;

  -- ─── Course 1: Design Grundlagen ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Design Grundlagen: Farbe, Typografie & Layout',
    'Lerne die fundamentalen Prinzipien von visuellem Design. Dieser Kurs behandelt Farbtheorie, Typografie-Regeln und Layout-Komposition fuer moderne digitale Produkte.',
    'ADMKRS Academy', 'design', 180, 'beginner',
    'https://example.com/design-basics', ARRAY['design', 'grundlagen', 'ui'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Farbtheorie verstehen', 'Farbkreis, Farbharmonien und Kontrastregeln', 0, 30),
    (c_id, 'Typografie-Basics', 'Schriftarten, Hierarchie und Lesbarkeit', 1, 35),
    (c_id, 'Layout & Komposition', 'Grid-Systeme, Whitespace und visuelle Balance', 2, 40),
    (c_id, 'Design-Prinzipien in der Praxis', 'Hands-on Uebungen mit realen Beispielen', 3, 45),
    (c_id, 'Abschlussprojekt', 'Erstelle ein vollstaendiges Layout-Konzept', 4, 30);

  -- ─── Course 2: React & Next.js ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'React & Next.js fuer Frontend-Entwickler',
    'Modernes Frontend-Development mit React 19 und Next.js App Router. Server Components, React Query, und production-ready Patterns.',
    'ADMKRS Academy', 'development', 480, 'intermediate',
    'https://example.com/react-nextjs', ARRAY['react', 'nextjs', 'frontend', 'typescript'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'React Grundlagen Refresher', 'JSX, Hooks, State Management', 0, 60),
    (c_id, 'Next.js App Router', 'Server Components, Routing, Layouts', 1, 80),
    (c_id, 'Data Fetching & React Query', 'Server-side und client-side Data Fetching', 2, 70),
    (c_id, 'Authentifizierung & Middleware', 'Supabase Auth, Protected Routes', 3, 60),
    (c_id, 'Performance & Deployment', 'Optimierung, Caching, Vercel Deployment', 4, 50),
    (c_id, 'Abschlussprojekt: Full-Stack App', 'Baue eine vollstaendige Applikation', 5, 160);

  -- ─── Course 3: Digitales Marketing ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Digitales Marketing: Strategie & Ausfuehrung',
    'Von der Zielgruppenanalyse bis zur Kampagnenoptimierung. Lerne SEO, Social Media Marketing, Content-Strategie und Performance-Analyse.',
    'ADMKRS Academy', 'marketing', 300, 'beginner',
    'https://example.com/digital-marketing', ARRAY['marketing', 'seo', 'social-media', 'strategie'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Zielgruppenanalyse', 'Personas erstellen und Zielgruppen definieren', 0, 45),
    (c_id, 'SEO Grundlagen', 'On-Page und Off-Page Optimierung', 1, 50),
    (c_id, 'Social Media Strategie', 'Plattformauswahl, Content-Planung, Community Management', 2, 60),
    (c_id, 'Content Marketing', 'Storytelling, Blog-Strategie, Video-Content', 3, 55),
    (c_id, 'Performance & Analytics', 'KPIs, Google Analytics, A/B Testing', 4, 50),
    (c_id, 'Kampagnen-Workshop', 'Plane und optimiere eine echte Kampagne', 5, 40);

  -- ─── Course 4: Leadership Essentials ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Leadership Essentials: Vom Kollegen zur Fuehrungskraft',
    'Der Uebergang in eine Fuehrungsrolle. Lerne Delegation, schwierige Gespraeche, Feedback-Kultur und Team-Motivation.',
    'Extern: Haufe Akademie', 'leadership', 360, 'intermediate',
    'https://example.com/leadership', ARRAY['leadership', 'management', 'fuehrung', 'kommunikation'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Rollenwechsel verstehen', 'Vom Experten zur Fuehrungskraft', 0, 45),
    (c_id, 'Delegation & Priorisierung', 'Aufgaben effektiv verteilen', 1, 50),
    (c_id, 'Feedback geben und nehmen', 'Konstruktives Feedback als Werkzeug', 2, 60),
    (c_id, 'Schwierige Gespraeche fuehren', 'Konfliktloesung und schwierige Situationen', 3, 55),
    (c_id, 'Team-Motivation', 'Intrinsische Motivation und Teamdynamik', 4, 50),
    (c_id, 'Praxis-Simulation', 'Rollenspiele und Case Studies', 5, 100);

  -- ─── Course 5: Data Analytics ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Data Analytics mit SQL & Dashboards',
    'Datengetriebene Entscheidungen treffen. SQL-Abfragen schreiben, Daten visualisieren und Dashboards bauen.',
    'ADMKRS Academy', 'data', 240, 'beginner',
    'https://example.com/data-analytics', ARRAY['data', 'sql', 'analytics', 'dashboards'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'SQL Grundlagen', 'SELECT, WHERE, JOIN, GROUP BY', 0, 50),
    (c_id, 'Fortgeschrittenes SQL', 'Subqueries, Window Functions, CTEs', 1, 50),
    (c_id, 'Daten-Visualisierung', 'Charts, Graphen und Best Practices', 2, 40),
    (c_id, 'Dashboard-Design', 'Effektive Dashboards mit Metabase/Superset', 3, 50),
    (c_id, 'Praxisprojekt', 'Analysiere einen echten Datensatz', 4, 50);

  -- ─── Course 6: Kommunikation & Praesentation ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Kommunikation & Praesentation im Business-Kontext',
    'Ueberzeugend praesentieren, klar kommunizieren und Meetings effektiv fuehren. Mit Storytelling-Techniken und praktischen Uebungen.',
    'Extern: Rhetorikhelden', 'communication', 200, 'beginner',
    'https://example.com/communication', ARRAY['kommunikation', 'praesentation', 'rhetorik', 'meetings'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Grundlagen der Kommunikation', 'Aktives Zuhoeren, Klarheit, Empathie', 0, 35),
    (c_id, 'Storytelling im Business', 'Narrative Strukturen fuer Praesentationen', 1, 40),
    (c_id, 'Praesentation-Design', 'Slides gestalten die wirken', 2, 40),
    (c_id, 'Meetings effektiv fuehren', 'Agenda, Moderation, Follow-ups', 3, 35),
    (c_id, 'Live-Praesentations-Uebung', 'Feedback zu deiner Praesentation', 4, 50);

  -- ─── Course 7: Produktmanagement ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'Product Management: Discovery bis Delivery',
    'Der komplette Produkt-Lifecycle. Von User Research ueber Roadmap-Planung bis zur Feature-Delivery mit agilen Methoden.',
    'ADMKRS Academy', 'product', 420, 'advanced',
    'https://example.com/product-management', ARRAY['product', 'agile', 'roadmap', 'user-research'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Product Discovery', 'User Research, Jobs-to-be-Done, Opportunity Mapping', 0, 70),
    (c_id, 'Priorisierung & Roadmap', 'RICE, Impact Mapping, Now/Next/Later', 1, 60),
    (c_id, 'Agile Delivery', 'Scrum, Kanban, Sprint Planning', 2, 70),
    (c_id, 'Stakeholder Management', 'Buy-in gewinnen, Konflikte loesen', 3, 50),
    (c_id, 'Metriken & OKRs', 'Product-KPIs definieren und tracken', 4, 60),
    (c_id, 'Capstone: Product Case Study', 'End-to-end Product Case', 5, 110);

  -- ─── Course 8: AI & Machine Learning Basics ───
  INSERT INTO public.courses (id, organization_id, title, description, provider, category, estimated_duration_minutes, difficulty, external_url, tags, is_published, created_by)
  VALUES (
    gen_random_uuid(), org_id,
    'AI & Machine Learning fuer Einsteiger',
    'Verstehe die Grundlagen von KI und ML. Kein Coding erforderlich — lerne Konzepte, Anwendungsfaelle und wie du AI-Tools im Arbeitsalltag nutzt.',
    'Extern: Coursera Partner', 'other', 150, 'beginner',
    'https://example.com/ai-ml-basics', ARRAY['ai', 'machine-learning', 'ki', 'chatgpt', 'tools'],
    true, NULL
  ) RETURNING id INTO c_id;
  INSERT INTO public.course_modules (course_id, title, description, sort_order, estimated_minutes) VALUES
    (c_id, 'Was ist KI?', 'Geschichte, Typen und aktuelle Entwicklungen', 0, 25),
    (c_id, 'Machine Learning verstehen', 'Supervised, Unsupervised, Reinforcement Learning', 1, 30),
    (c_id, 'AI-Tools im Arbeitsalltag', 'ChatGPT, Claude, Midjourney, Copilot', 2, 35),
    (c_id, 'Prompt Engineering', 'Effektive Prompts schreiben', 3, 30),
    (c_id, 'Ethik & Verantwortung', 'Bias, Datenschutz, verantwortungsvoller Einsatz', 4, 30);

END $$;
