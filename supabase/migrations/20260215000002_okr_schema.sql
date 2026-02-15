-- Migration 2: OKR Schema
-- OKRs, Key Results, Check-ins, Audit Logs

-- OKRs
CREATE TABLE public.okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  why_it_matters TEXT,
  quarter TEXT NOT NULL, -- "Q1 2026" format
  category TEXT NOT NULL CHECK (category IN ('performance', 'skill', 'learning', 'career')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  confidence INTEGER DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  scope TEXT DEFAULT 'personal' CHECK (scope IN ('personal', 'team', 'company')),
  due_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_focus BOOLEAN DEFAULT false NOT NULL,
  sort_order INTEGER DEFAULT 0,
  parent_okr_id UUID REFERENCES public.okrs(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  last_checkin_at TIMESTAMPTZ,
  next_checkin_at TIMESTAMPTZ,
  checkin_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Key Results
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_value DECIMAL DEFAULT 0,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT, -- "ROAS", "%", "Stunden", "Anzahl", etc.
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  sort_order INTEGER DEFAULT 0,
  source_url TEXT,
  source_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Check-ins
CREATE TABLE public.okr_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_update INTEGER,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  what_helped TEXT, -- Wins
  what_blocked TEXT, -- Blockers
  next_steps TEXT,
  change_type TEXT DEFAULT 'progress' CHECK (change_type IN ('progress', 'edit')),
  change_details JSONB DEFAULT '{}', -- Field-level diffs for edits
  checked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Logs
CREATE TABLE public.okr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_okrs_org_user_quarter ON public.okrs(organization_id, user_id, quarter);
CREATE INDEX idx_okrs_org_active_quarter ON public.okrs(organization_id, is_active, quarter);
CREATE INDEX idx_okrs_user_focus ON public.okrs(user_id, is_focus) WHERE is_focus = true;
CREATE INDEX idx_key_results_okr ON public.key_results(okr_id);
CREATE INDEX idx_checkins_okr_date ON public.okr_checkins(okr_id, checked_at);
CREATE INDEX idx_audit_org_date ON public.okr_audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_user ON public.okr_audit_logs(user_id, created_at);
