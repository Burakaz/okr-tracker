-- Migration 7: Fix trigger chain bug + add missing profiles updated_at trigger
--
-- BUG: auto_okr_progress_on_kr_change fires on UPDATE OF progress,
-- but when current_value changes, the BEFORE trigger (auto_kr_progress)
-- recalculates progress internally. PostgreSQL does NOT consider this
-- a column change for the AFTER trigger's column filter.
--
-- FIX: Change to fire on current_value, start_value, target_value changes
-- (the actual user-facing columns) instead of the derived progress column.

-- Drop the old trigger
DROP TRIGGER IF EXISTS auto_okr_progress_on_kr_change ON public.key_results;

-- Recreate with correct column list
CREATE TRIGGER auto_okr_progress_on_kr_change
  AFTER INSERT OR UPDATE OF current_value, start_value, target_value, progress OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_okr_progress();

-- Add missing profiles updated_at trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
