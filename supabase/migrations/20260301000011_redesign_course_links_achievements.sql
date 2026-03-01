-- =====================================================
-- Redesign: OKR-Course Links + Achievements
-- =====================================================

-- 1. okr_course_links: Verknüpfung OKR Key Results → Kurs-Enrollments
CREATE TABLE okr_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  auto_update BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key_result_id, enrollment_id)
);

-- 2. achievements: Gamification-Badges
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'first_okr','first_checkin','first_course_completed',
    'streak_3w','streak_8w','quarter_hero','learning_machine','all_completed'
  )),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, type)
);

-- Indexes
CREATE INDEX idx_okr_course_links_kr ON okr_course_links(key_result_id);
CREATE INDEX idx_okr_course_links_enrollment ON okr_course_links(enrollment_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_achievements_org ON achievements(organization_id);

-- RLS
ALTER TABLE okr_course_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- OKR Course Links: User can manage links for their own OKRs
CREATE POLICY "okr_course_links_own" ON okr_course_links FOR ALL
  USING (key_result_id IN (
    SELECT kr.id FROM key_results kr
    JOIN okrs o ON kr.okr_id = o.id
    WHERE o.user_id = auth.uid()
  ));

-- Achievements: User can see own
CREATE POLICY "achievements_own" ON achievements FOR SELECT
  USING (user_id = auth.uid());

-- Achievements: Managers can see team
CREATE POLICY "achievements_team_read" ON achievements FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('manager','hr','admin','super_admin')
  ));

-- Service role can insert achievements
CREATE POLICY "achievements_service_insert" ON achievements FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Auto-update trigger: module_completion → update linked key_result
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_kr_from_course()
RETURNS TRIGGER AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_modules INT;
  v_completed_modules INT;
  v_link RECORD;
BEGIN
  v_enrollment_id := NEW.enrollment_id;

  FOR v_link IN
    SELECT ocl.key_result_id, kr.target_value
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
          updated_at = now()
      WHERE id = v_link.key_result_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_update_kr
  AFTER INSERT OR DELETE ON module_completions
  FOR EACH ROW EXECUTE FUNCTION auto_update_kr_from_course();
