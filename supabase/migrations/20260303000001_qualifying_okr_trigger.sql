-- Auto-update qualifying_okr_count when OKR progress changes
-- A "qualifying" OKR has progress >= 70 (score >= 0.7)

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

  -- Count OKRs with progress >= 70 (score >= 0.7)
  SELECT COUNT(*) INTO _qualifying_count
  FROM okrs
  WHERE user_id = NEW.user_id
    AND organization_id = _org_id
    AND progress >= 70;

  -- Count total OKRs
  SELECT COUNT(*) INTO _total_count
  FROM okrs
  WHERE user_id = NEW.user_id
    AND organization_id = _org_id;

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

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_update_qualifying_okrs ON okrs;

-- Create trigger on OKR insert/update
CREATE TRIGGER trg_update_qualifying_okrs
AFTER INSERT OR UPDATE OF progress ON okrs
FOR EACH ROW
EXECUTE FUNCTION public.update_qualifying_okr_count();
