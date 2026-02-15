-- Migration 3: Career Schema
-- Career Levels, User Career Progress

-- Career Levels
CREATE TABLE public.career_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Junior", "Mid", "Senior", "Lead", etc.
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  min_okrs_with_target_score INTEGER DEFAULT 4,
  target_score_threshold DECIMAL DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add FK to profiles for career_level_id
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_career_level
  FOREIGN KEY (career_level_id) REFERENCES public.career_levels(id) ON DELETE SET NULL;

-- User Career Progress
CREATE TABLE public.user_career_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  current_level_id UUID REFERENCES public.career_levels(id) ON DELETE SET NULL,
  qualifying_okr_count INTEGER DEFAULT 0,
  total_okrs_attempted INTEGER DEFAULT 0,
  level_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_career_levels_org ON public.career_levels(organization_id, sort_order);
CREATE INDEX idx_career_progress_user ON public.user_career_progress(user_id, organization_id);
