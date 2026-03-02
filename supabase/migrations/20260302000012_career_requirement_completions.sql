-- Migration 12: Career Requirement Completions
-- Allows users to track their progress on individual career requirements

CREATE TABLE public.career_requirement_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  career_path_id TEXT NOT NULL,       -- e.g. "performance_marketing"
  level_id TEXT NOT NULL,             -- e.g. "junior", "midlevel"
  requirement_index INTEGER NOT NULL, -- index in the requirements array
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, career_path_id, level_id, requirement_index)
);

CREATE INDEX idx_career_req_user ON public.career_requirement_completions(user_id, career_path_id, level_id);

-- RLS
ALTER TABLE public.career_requirement_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requirement completions"
  ON public.career_requirement_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requirement completions"
  ON public.career_requirement_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requirement completions"
  ON public.career_requirement_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requirement completions"
  ON public.career_requirement_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_career_req_updated_at
  BEFORE UPDATE ON public.career_requirement_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
