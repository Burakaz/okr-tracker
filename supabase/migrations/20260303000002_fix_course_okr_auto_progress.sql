-- =====================================================
-- Fix auto-progress chain: Module → KR → OKR
-- =====================================================

-- 1) Fix auto_update_kr_from_course: also update key_results.progress
CREATE OR REPLACE FUNCTION auto_update_kr_from_course()
RETURNS TRIGGER AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_modules INT;
  v_completed_modules INT;
  v_link RECORD;
BEGIN
  -- Get enrollment_id from either NEW or OLD (for DELETE)
  IF TG_OP = 'DELETE' THEN
    v_enrollment_id := OLD.enrollment_id;
  ELSE
    v_enrollment_id := NEW.enrollment_id;
  END IF;

  FOR v_link IN
    SELECT ocl.key_result_id, kr.target_value, kr.start_value
    FROM okr_course_links ocl
    JOIN key_results kr ON kr.id = ocl.key_result_id
    WHERE ocl.enrollment_id = v_enrollment_id AND ocl.auto_update = true
  LOOP
    SELECT COUNT(*) INTO v_total_modules
    FROM course_modules cm
    JOIN enrollments e ON e.course_id = cm.course_id
    WHERE e.id = v_enrollment_id;

    SELECT COUNT(*) INTO v_completed_modules
    FROM module_completions mc
    WHERE mc.enrollment_id = v_enrollment_id;

    IF v_total_modules > 0 THEN
      UPDATE key_results
      SET current_value = ROUND((v_completed_modules::NUMERIC / v_total_modules) * v_link.target_value),
          progress = ROUND((v_completed_modules::NUMERIC / v_total_modules) * 100),
          updated_at = now()
      WHERE id = v_link.key_result_id;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) New trigger: when key_results.progress changes, recalculate okrs.progress
CREATE OR REPLACE FUNCTION auto_update_okr_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_okr_progress INTEGER;
BEGIN
  -- Calculate average progress of all KRs for this OKR
  SELECT COALESCE(ROUND(AVG(progress)), 0)::INTEGER
  INTO v_okr_progress
  FROM key_results
  WHERE okr_id = NEW.okr_id;

  -- Update OKR progress
  UPDATE okrs
  SET progress = v_okr_progress,
      updated_at = now()
  WHERE id = NEW.okr_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_update_okr_progress ON key_results;

-- Create trigger: fires when KR progress changes
CREATE TRIGGER trg_auto_update_okr_progress
  AFTER INSERT OR UPDATE OF progress ON key_results
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_okr_progress();
