-- =============================================
-- Learning Hub Schema
-- =============================================

-- courses: Kurskatalog (Admin-erstellt oder Mitarbeiter-erstellt)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  provider TEXT NOT NULL DEFAULT 'Intern',
  category TEXT NOT NULL CHECK (category IN ('design','development','marketing','leadership','data','communication','product','other')),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  external_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- course_modules: Module/Lektionen pro Kurs
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- enrollments: User-Einschreibung in Kurs
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','paused','dropped')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- module_completions: Welche Module ein User abgehakt hat
CREATE TABLE IF NOT EXISTS public.module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

-- certificates: Hochgeladene Zertifikate/Nachweise
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_courses_org ON public.courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_org ON public.enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_enrollment ON public.module_completions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON public.certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Courses: Org-Mitglieder können lesen, Ersteller/Admin können schreiben
CREATE POLICY "courses_select" ON public.courses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "courses_insert" ON public.courses FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "courses_update" ON public.courses FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
CREATE POLICY "courses_delete" ON public.courses FOR DELETE
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- Course Modules: Lesbar für Org-Mitglieder, Schreibbar via Service Client
CREATE POLICY "modules_select" ON public.course_modules FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Enrollments: User sieht eigene; Manager/HR/Admin sieht Org
CREATE POLICY "enrollments_own" ON public.enrollments FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "enrollments_team_read" ON public.enrollments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('manager','hr','admin','super_admin')));

-- Module Completions: Via Enrollment-Ownership
CREATE POLICY "completions_own" ON public.module_completions FOR ALL
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));

-- Certificates: User sieht eigene; Manager/HR/Admin kann Org sehen
CREATE POLICY "certificates_own" ON public.certificates FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "certificates_team_read" ON public.certificates FOR SELECT
  USING (user_id IN (
    SELECT p2.id FROM public.profiles p2
    WHERE p2.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager','hr','admin','super_admin'))
  ));

-- =============================================
-- Storage Bucket für Zertifikate
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Updated_at Trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
