-- Migration 5: Triggers and Automated Functions
-- updated_at triggers, KR progress auto-calc, OKR progress rollup, check-in automation

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER okrs_updated_at
  BEFORE UPDATE ON public.okrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER career_progress_updated_at
  BEFORE UPDATE ON public.user_career_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-calculate KR progress when current_value changes
CREATE OR REPLACE FUNCTION public.auto_calculate_kr_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_value != NEW.start_value THEN
    NEW.progress = GREATEST(0, ROUND(
      ((NEW.current_value - NEW.start_value) / (NEW.target_value - NEW.start_value)) * 100
    )::INTEGER);
  ELSE
    NEW.progress = CASE WHEN NEW.current_value >= NEW.target_value THEN 100 ELSE 0 END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_kr_progress
  BEFORE INSERT OR UPDATE OF current_value, start_value, target_value ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_kr_progress();

-- Auto-update OKR progress when any KR progress changes
CREATE OR REPLACE FUNCTION public.auto_update_okr_progress()
RETURNS TRIGGER AS $$
DECLARE
  avg_progress INTEGER;
BEGIN
  SELECT COALESCE(ROUND(AVG(progress)), 0)
  INTO avg_progress
  FROM public.key_results
  WHERE okr_id = COALESCE(NEW.okr_id, OLD.okr_id);

  UPDATE public.okrs
  SET progress = avg_progress
  WHERE id = COALESCE(NEW.okr_id, OLD.okr_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_okr_progress_on_kr_change
  AFTER INSERT OR UPDATE OF progress OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_okr_progress();

-- Auto-set next checkin date and increment count
CREATE OR REPLACE FUNCTION public.auto_checkin_updates()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.okrs
  SET
    last_checkin_at = NEW.checked_at,
    next_checkin_at = NEW.checked_at + INTERVAL '14 days',
    checkin_count = checkin_count + 1,
    confidence = COALESCE(NEW.confidence, confidence)
  WHERE id = NEW.okr_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_checkin_updates
  AFTER INSERT ON public.okr_checkins
  FOR EACH ROW EXECUTE FUNCTION public.auto_checkin_updates();
