-- Migration 4: Row Level Security Policies
-- Enable RLS, helper functions, and all access policies

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_career_progress ENABLE ROW LEVEL SECURITY;

-- Helper: Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(uid UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is manager of another user
CREATE OR REPLACE FUNCTION public.is_manager_of(manager_uid UUID, employee_uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = employee_uid AND manager_id = manager_uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if user is HR or Admin
CREATE OR REPLACE FUNCTION public.is_hr_or_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('hr', 'admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== PROFILES ==========
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same org"
  ON public.profiles FOR SELECT
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "HR/Admin can manage profiles in org"
  ON public.profiles FOR ALL
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- ========== ORGANIZATIONS ==========
CREATE POLICY "Users can view own org"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_org_id(auth.uid()));

-- ========== TEAMS ==========
CREATE POLICY "Users can view teams in own org"
  ON public.teams FOR SELECT
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admin can manage teams"
  ON public.teams FOR ALL
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- ========== TEAM MEMBERS ==========
CREATE POLICY "Users can view team members in own org"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND t.organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- ========== OKRs ==========
CREATE POLICY "Users can view own OKRs"
  ON public.okrs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view direct reports OKRs"
  ON public.okrs FOR SELECT
  USING (public.is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR/Admin can view all org OKRs"
  ON public.okrs FOR SELECT
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "Users can create own OKRs"
  ON public.okrs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own OKRs"
  ON public.okrs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own OKRs"
  ON public.okrs FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "HR/Admin can manage all org OKRs"
  ON public.okrs FOR ALL
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- ========== KEY RESULTS ==========
CREATE POLICY "Users can view KRs of own OKRs"
  ON public.key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      WHERE o.id = okr_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view KRs of direct reports"
  ON public.key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      WHERE o.id = okr_id AND public.is_manager_of(auth.uid(), o.user_id)
    )
  );

CREATE POLICY "HR/Admin can view all org KRs"
  ON public.key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      WHERE o.id = okr_id
      AND o.organization_id = public.get_user_org_id(auth.uid())
      AND public.is_hr_or_admin(auth.uid())
    )
  );

CREATE POLICY "Users can manage KRs of own OKRs"
  ON public.key_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      WHERE o.id = okr_id AND o.user_id = auth.uid()
    )
  );

-- ========== CHECK-INS ==========
CREATE POLICY "Users can view own checkins"
  ON public.okr_checkins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view direct reports checkins"
  ON public.okr_checkins FOR SELECT
  USING (public.is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR/Admin can view org checkins"
  ON public.okr_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      WHERE o.id = okr_id
      AND o.organization_id = public.get_user_org_id(auth.uid())
      AND public.is_hr_or_admin(auth.uid())
    )
  );

CREATE POLICY "Users can create own checkins"
  ON public.okr_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========== AUDIT LOGS (append-only for users) ==========
CREATE POLICY "Users can view own audit logs"
  ON public.okr_audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "HR/Admin can view org audit logs"
  ON public.okr_audit_logs FOR SELECT
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- ========== CAREER LEVELS ==========
CREATE POLICY "Users can view career levels in org"
  ON public.career_levels FOR SELECT
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admin can manage career levels"
  ON public.career_levels FOR ALL
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );

-- ========== USER CAREER PROGRESS ==========
CREATE POLICY "Users can view own career progress"
  ON public.user_career_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view direct reports career progress"
  ON public.user_career_progress FOR SELECT
  USING (public.is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR/Admin can manage org career progress"
  ON public.user_career_progress FOR ALL
  USING (
    public.is_hr_or_admin(auth.uid())
    AND organization_id = public.get_user_org_id(auth.uid())
  );
