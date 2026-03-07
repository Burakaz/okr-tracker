-- Red-Team Sprint Fixes: P1-5 (KR Progress Cap) + P1-4 (Qualifying Trigger is_active filter)
-- Date: 2026-03-07

-- ============================================================
-- P1-5: Cap KR progress to 0-100% range
-- Previously: GREATEST(0, ...) allowed progress > 100%
-- Fix: Add LEAST(100, ...) to enforce upper bound
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_calculate_kr_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_value != NEW.start_value THEN
    -- P1-FIX: Cap progress to 0-100 range (was only floored at 0)
    NEW.progress = LEAST(100, GREATEST(0, ROUND(
      ((NEW.current_value - NEW.start_value) / (NEW.target_value - NEW.start_value)) * 100
    )::INTEGER));
  ELSE
    NEW.progress = CASE WHEN NEW.current_value >= NEW.target_value THEN 100 ELSE 0 END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- P1-4: Qualifying OKR trigger must filter out soft-deleted OKRs
-- Previously: Counted ALL OKRs regardless of is_active flag
-- Fix: Add AND is_active = true to both COUNT queries
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_qualifying_okr_count()
RETURNS TRIGGER AS $$
DECLARE
  _org_id UUID;
  _qualifying_count INTEGER;
  _total_count INTEGER;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO _org_id
  FROM profiles WHERE id = NEW.user_id;

  IF _org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- P1-FIX: Count only ACTIVE OKRs with progress >= 70 (score >= 0.7)
  SELECT COUNT(*) INTO _qualifying_count
  FROM okrs
  WHERE user_id = NEW.user_id
    AND organization_id = _org_id
    AND progress >= 70
    AND is_active = true;

  -- P1-FIX: Count only ACTIVE total OKRs
  SELECT COUNT(*) INTO _total_count
  FROM okrs
  WHERE user_id = NEW.user_id
    AND organization_id = _org_id
    AND is_active = true;

  -- Upsert career progress
  INSERT INTO user_career_progress (user_id, organization_id, qualifying_okr_count, total_okrs_attempted)
  VALUES (NEW.user_id, _org_id, _qualifying_count, _total_count)
  ON CONFLICT (user_id, organization_id)
  DO UPDATE SET
    qualifying_okr_count = _qualifying_count,
    total_okrs_attempted = _total_count,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- P3-3: Prevent manager self-reference loops
-- ============================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_no_manager_self_reference;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_no_manager_self_reference
  CHECK (manager_id IS NULL OR manager_id != id);
