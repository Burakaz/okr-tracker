-- Check-in Reviews: Manager feedback on employee check-ins
CREATE TABLE IF NOT EXISTS public.checkin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES public.okr_checkins(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'noted', 'rejected')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(checkin_id)
);

CREATE INDEX IF NOT EXISTS idx_checkin_reviews_checkin ON public.checkin_reviews(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_reviews_reviewer ON public.checkin_reviews(reviewer_id);

-- Enable RLS
ALTER TABLE public.checkin_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Managers/HR/Admin can insert/update reviews for their org members
CREATE POLICY "managers_can_review" ON public.checkin_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('manager', 'hr', 'admin', 'super_admin')
    )
  );

-- Policy: Users can read reviews on their own check-ins
CREATE POLICY "users_can_read_own_reviews" ON public.checkin_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_checkins c
      WHERE c.id = checkin_reviews.checkin_id
      AND c.user_id = auth.uid()
    )
  );
