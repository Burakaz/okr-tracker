import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentQuarter,
  getNextQuarter,
  getPreviousQuarter,
  getQuarterDateRange,
  getAvailableQuarters,
  progressToScore,
  scoreToProgress,
  getScoreInterpretation,
  calculateExpectedProgress,
  calculateStatus,
  getStatusLabel,
  getStatusClassName,
  calculateOKRProgress,
  calculateKRProgress,
  getConfidenceLabel,
  getConfidenceColor,
  isCheckinOverdue,
  getCheckinDaysRemaining,
  canAddFocus,
  canCreateOKR,
  qualifiesForLevelUp,
  getCategoryLabel,
  getCategoryClassName,
  MAX_OKRS_PER_QUARTER,
  MAX_FOCUS,
  CHECKIN_INTERVAL_DAYS,
  TARGET_SCORE,
  MIN_OKRS_FOR_LEVEL_UP,
} from '@/lib/okr-logic';

describe('Quarter Helpers', () => {
  it('getCurrentQuarter returns correct format', () => {
    const result = getCurrentQuarter();
    expect(result).toMatch(/^Q[1-4] \d{4}$/);
  });

  it('getNextQuarter increments correctly', () => {
    expect(getNextQuarter('Q1 2026')).toBe('Q2 2026');
    expect(getNextQuarter('Q2 2026')).toBe('Q3 2026');
    expect(getNextQuarter('Q3 2026')).toBe('Q4 2026');
    expect(getNextQuarter('Q4 2026')).toBe('Q1 2027');
  });

  it('getPreviousQuarter decrements correctly', () => {
    expect(getPreviousQuarter('Q4 2026')).toBe('Q3 2026');
    expect(getPreviousQuarter('Q1 2026')).toBe('Q4 2025');
  });

  it('getQuarterDateRange returns correct dates', () => {
    const { start, end } = getQuarterDateRange('Q1 2026');
    expect(start.getMonth()).toBe(0); // January
    expect(start.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(2); // March
    expect(end.getDate()).toBe(31);
  });

  it('getQuarterDateRange Q2 returns April-June', () => {
    const { start, end } = getQuarterDateRange('Q2 2026');
    expect(start.getMonth()).toBe(3); // April
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(5); // June
    expect(end.getDate()).toBe(30);
  });

  it('getQuarterDateRange Q3 returns July-September', () => {
    const { start, end } = getQuarterDateRange('Q3 2026');
    expect(start.getMonth()).toBe(6); // July
    expect(end.getMonth()).toBe(8); // September
    expect(end.getDate()).toBe(30);
  });

  it('getQuarterDateRange Q4 returns October-December', () => {
    const { start, end } = getQuarterDateRange('Q4 2026');
    expect(start.getMonth()).toBe(9); // October
    expect(end.getMonth()).toBe(11); // December
    expect(end.getDate()).toBe(31);
  });

  it('getQuarterDateRange handles invalid format gracefully', () => {
    const { start, end } = getQuarterDateRange('invalid');
    // Should return current date for both
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
  });

  it('getAvailableQuarters returns 3 quarters', () => {
    const quarters = getAvailableQuarters();
    expect(quarters).toHaveLength(3);
    expect(quarters[1].isCurrent).toBe(true);
    expect(quarters[0].isCurrent).toBe(false);
    expect(quarters[2].isCurrent).toBe(false);
  });

  it('getAvailableQuarters returns prev, current, next in order', () => {
    const quarters = getAvailableQuarters();
    const current = getCurrentQuarter();
    const prev = getPreviousQuarter(current);
    const next = getNextQuarter(current);

    expect(quarters[0].value).toBe(prev);
    expect(quarters[1].value).toBe(current);
    expect(quarters[2].value).toBe(next);
  });

  it('getAvailableQuarters sets label equal to value', () => {
    const quarters = getAvailableQuarters();
    quarters.forEach((q) => {
      expect(q.label).toBe(q.value);
    });
  });

  it('getNextQuarter without argument uses current quarter', () => {
    const result = getNextQuarter();
    const current = getCurrentQuarter();
    const expected = getNextQuarter(current);
    expect(result).toBe(expected);
  });

  it('getPreviousQuarter without argument uses current quarter', () => {
    const result = getPreviousQuarter();
    const current = getCurrentQuarter();
    const expected = getPreviousQuarter(current);
    expect(result).toBe(expected);
  });

  it('getNextQuarter with invalid format returns current quarter', () => {
    const result = getNextQuarter('invalid');
    expect(result).toMatch(/^Q[1-4] \d{4}$/);
  });

  it('getPreviousQuarter with invalid format returns current quarter', () => {
    const result = getPreviousQuarter('invalid');
    expect(result).toMatch(/^Q[1-4] \d{4}$/);
  });
});

describe('Score & Progress', () => {
  it('progressToScore converts correctly', () => {
    expect(progressToScore(0)).toBe(0);
    expect(progressToScore(50)).toBe(0.5);
    expect(progressToScore(70)).toBe(0.7);
    expect(progressToScore(100)).toBe(1.0);
  });

  it('progressToScore rounds to one decimal', () => {
    expect(progressToScore(33)).toBe(0.3);
    expect(progressToScore(67)).toBe(0.7);
    expect(progressToScore(15)).toBe(0.2);
    expect(progressToScore(85)).toBe(0.9);
  });

  it('scoreToProgress converts correctly', () => {
    expect(scoreToProgress(0)).toBe(0);
    expect(scoreToProgress(0.5)).toBe(50);
    expect(scoreToProgress(0.7)).toBe(70);
    expect(scoreToProgress(1.0)).toBe(100);
  });

  it('scoreToProgress rounds to integer', () => {
    expect(scoreToProgress(0.33)).toBe(33);
    expect(scoreToProgress(0.667)).toBe(67);
  });

  it('getScoreInterpretation returns correct labels', () => {
    expect(getScoreInterpretation(0.8).label).toBe('Erfolgreich');
    expect(getScoreInterpretation(0.7).label).toBe('Erfolgreich');
    expect(getScoreInterpretation(0.5).label).toBe('Teilweise erreicht');
    expect(getScoreInterpretation(0.3).label).toBe('Nicht erreicht');
  });

  it('getScoreInterpretation returns correct classNames', () => {
    expect(getScoreInterpretation(0.8).className).toBe('badge-green');
    expect(getScoreInterpretation(0.5).className).toBe('badge-yellow');
    expect(getScoreInterpretation(0.2).className).toBe('badge-red');
  });

  it('getScoreInterpretation boundary at 0.7', () => {
    expect(getScoreInterpretation(0.7).label).toBe('Erfolgreich');
    expect(getScoreInterpretation(0.69).label).toBe('Teilweise erreicht');
  });

  it('getScoreInterpretation boundary at 0.4', () => {
    expect(getScoreInterpretation(0.4).label).toBe('Teilweise erreicht');
    expect(getScoreInterpretation(0.39).label).toBe('Nicht erreicht');
  });

  it('getScoreInterpretation returns color and bgColor', () => {
    const result = getScoreInterpretation(0.8);
    expect(result.color).toBe('#16a34a');
    expect(result.bgColor).toBe('#dcfce7');

    const yellow = getScoreInterpretation(0.5);
    expect(yellow.color).toBe('#a16207');
    expect(yellow.bgColor).toBe('#fef9c3');

    const red = getScoreInterpretation(0.2);
    expect(red.color).toBe('#dc2626');
    expect(red.bgColor).toBe('#fee2e2');
  });
});

describe('Status Calculation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculateExpectedProgress returns 0 before start', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const tomorrow = new Date('2026-03-16T12:00:00Z').toISOString();
    const futureEnd = new Date('2026-06-15T12:00:00Z').toISOString();
    expect(calculateExpectedProgress(tomorrow, futureEnd)).toBe(0);
  });

  it('calculateExpectedProgress returns 100 after end', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    vi.setSystemTime(now);

    const pastStart = new Date('2026-01-01T12:00:00Z').toISOString();
    const yesterday = new Date('2026-06-14T12:00:00Z').toISOString();
    expect(calculateExpectedProgress(pastStart, yesterday)).toBe(100);
  });

  it('calculateExpectedProgress returns 80% of linear at midpoint', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    // 90 days total, 45 days elapsed = 50% linear, 40% expected
    const start = new Date('2026-01-29T12:00:00Z').toISOString();
    const end = new Date('2026-04-29T12:00:00Z').toISOString();
    const result = calculateExpectedProgress(start, end);
    expect(result).toBe(40); // 50% * 80% = 40%
  });

  it('calculateStatus returns on_track when ahead of expected', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const start = new Date('2026-01-29T12:00:00Z').toISOString(); // 45 days ago
    const end = new Date('2026-04-29T12:00:00Z').toISOString(); // 45 days from now
    // Expected ~40%. 45% actual, diff = +5, on_track (>= -10)
    expect(calculateStatus(45, start, end)).toBe('on_track');
  });

  it('calculateStatus returns at_risk when slightly behind', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const start = new Date('2026-01-14T12:00:00Z').toISOString(); // 60 days ago
    const end = new Date('2026-04-14T12:00:00Z').toISOString(); // 30 days from now
    // 60/90 = 67% elapsed. Expected = 67% * 80% = ~53%. 30% actual, diff = -23 (between -10 and -30)
    expect(calculateStatus(30, start, end)).toBe('at_risk');
  });

  it('calculateStatus returns off_track when far behind', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const start = new Date('2025-12-25T12:00:00Z').toISOString(); // 80 days ago
    const end = new Date('2026-03-25T12:00:00Z').toISOString(); // 10 days from now
    // 80/90 = 89% elapsed. Expected = 89% * 80% = ~71%. 10% actual, diff = -61 (< -30)
    expect(calculateStatus(10, start, end)).toBe('off_track');
  });

  it('calculateStatus returns on_track when at 100% with any timing', () => {
    const now = new Date('2026-03-15T12:00:00Z');
    vi.setSystemTime(now);

    const start = new Date('2026-01-01T12:00:00Z').toISOString();
    const end = new Date('2026-06-30T12:00:00Z').toISOString();
    expect(calculateStatus(100, start, end)).toBe('on_track');
  });

  it('getStatusLabel returns German labels', () => {
    expect(getStatusLabel('on_track')).toBe('Im Plan');
    expect(getStatusLabel('at_risk')).toBe('Gef\u00e4hrdet');
    expect(getStatusLabel('off_track')).toBe('Kritisch');
  });

  it('getStatusClassName returns correct badge classes', () => {
    expect(getStatusClassName('on_track')).toBe('badge-green');
    expect(getStatusClassName('at_risk')).toBe('badge-yellow');
    expect(getStatusClassName('off_track')).toBe('badge-red');
  });
});

describe('OKR Progress', () => {
  it('calculateOKRProgress returns 0 for empty key results', () => {
    expect(calculateOKRProgress([])).toBe(0);
  });

  it('calculateOKRProgress averages key result progress', () => {
    const krs = [
      { progress: 80 },
      { progress: 60 },
      { progress: 40 },
    ] as any[];
    expect(calculateOKRProgress(krs)).toBe(60);
  });

  it('calculateOKRProgress handles single key result', () => {
    const krs = [{ progress: 75 }] as any[];
    expect(calculateOKRProgress(krs)).toBe(75);
  });

  it('calculateOKRProgress rounds to nearest integer', () => {
    const krs = [
      { progress: 33 },
      { progress: 67 },
      { progress: 50 },
    ] as any[];
    expect(calculateOKRProgress(krs)).toBe(50);
  });

  it('calculateOKRProgress handles all zeros', () => {
    const krs = [
      { progress: 0 },
      { progress: 0 },
    ] as any[];
    expect(calculateOKRProgress(krs)).toBe(0);
  });

  it('calculateOKRProgress handles all 100s', () => {
    const krs = [
      { progress: 100 },
      { progress: 100 },
    ] as any[];
    expect(calculateOKRProgress(krs)).toBe(100);
  });

  it('calculateKRProgress calculates correctly', () => {
    expect(calculateKRProgress(5, 0, 10)).toBe(50);
    expect(calculateKRProgress(10, 0, 10)).toBe(100);
    expect(calculateKRProgress(0, 0, 10)).toBe(0);
    expect(calculateKRProgress(2.5, 1, 6)).toBe(30); // (2.5-1)/(6-1) = 0.3
  });

  it('calculateKRProgress handles equal start and target', () => {
    expect(calculateKRProgress(5, 5, 5)).toBe(100);
    expect(calculateKRProgress(3, 5, 5)).toBe(0);
  });

  it('calculateKRProgress clamps to 0 minimum', () => {
    // current below start should not go negative
    expect(calculateKRProgress(-5, 0, 10)).toBe(0);
  });

  it('calculateKRProgress can exceed 100', () => {
    // current above target
    const result = calculateKRProgress(15, 0, 10);
    expect(result).toBe(150);
  });

  it('calculateKRProgress with non-zero start', () => {
    expect(calculateKRProgress(50, 10, 100)).toBe(44); // (50-10)/(100-10) = 44.4%
  });
});

describe('Confidence', () => {
  it('getConfidenceLabel returns correct German labels', () => {
    expect(getConfidenceLabel(1)).toBe('Wird nicht erreicht');
    expect(getConfidenceLabel(2)).toBe('Unwahrscheinlich');
    expect(getConfidenceLabel(3)).toBe('M\u00f6glich');
    expect(getConfidenceLabel(4)).toBe('Wahrscheinlich');
    expect(getConfidenceLabel(5)).toBe('Wird erreicht');
  });

  it('getConfidenceColor returns correct badge classes', () => {
    expect(getConfidenceColor(1)).toBe('badge-red');
    expect(getConfidenceColor(2)).toBe('badge-red');
    expect(getConfidenceColor(3)).toBe('badge-yellow');
    expect(getConfidenceColor(4)).toBe('badge-green');
    expect(getConfidenceColor(5)).toBe('badge-green');
  });
});

describe('Check-in', () => {
  it('isCheckinOverdue returns true for past dates', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isCheckinOverdue(past)).toBe(true);
  });

  it('isCheckinOverdue returns false for future dates', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isCheckinOverdue(future)).toBe(false);
  });

  it('isCheckinOverdue returns false for null', () => {
    expect(isCheckinOverdue(null)).toBe(false);
  });

  it('getCheckinDaysRemaining returns correct count', () => {
    const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString();
    const remaining = getCheckinDaysRemaining(inThreeDays);
    expect(remaining).toBeGreaterThanOrEqual(2);
    expect(remaining).toBeLessThanOrEqual(4);
  });

  it('getCheckinDaysRemaining returns null for null input', () => {
    expect(getCheckinDaysRemaining(null)).toBeNull();
  });

  it('getCheckinDaysRemaining returns negative for past dates', () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
    const remaining = getCheckinDaysRemaining(twoDaysAgo);
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeLessThan(0);
  });
});

describe('Limits', () => {
  it('canAddFocus returns true when under limit', () => {
    expect(canAddFocus(0)).toBe(true);
    expect(canAddFocus(1)).toBe(true);
  });

  it('canAddFocus returns false at limit', () => {
    expect(canAddFocus(2)).toBe(false);
    expect(canAddFocus(3)).toBe(false);
  });

  it('canCreateOKR returns true when under limit', () => {
    expect(canCreateOKR(0)).toBe(true);
    expect(canCreateOKR(4)).toBe(true);
  });

  it('canCreateOKR returns false at limit', () => {
    expect(canCreateOKR(5)).toBe(false);
  });

  it('canCreateOKR returns false above limit', () => {
    expect(canCreateOKR(6)).toBe(false);
    expect(canCreateOKR(10)).toBe(false);
  });
});

describe('Career', () => {
  it('qualifiesForLevelUp returns true when enough OKRs', () => {
    expect(qualifiesForLevelUp(4)).toBe(true);
    expect(qualifiesForLevelUp(5)).toBe(true);
  });

  it('qualifiesForLevelUp returns false when not enough', () => {
    expect(qualifiesForLevelUp(3)).toBe(false);
    expect(qualifiesForLevelUp(0)).toBe(false);
  });

  it('qualifiesForLevelUp respects custom required count', () => {
    expect(qualifiesForLevelUp(2, 2)).toBe(true);
    expect(qualifiesForLevelUp(1, 2)).toBe(false);
  });

  it('qualifiesForLevelUp returns true at exact boundary', () => {
    expect(qualifiesForLevelUp(4, 4)).toBe(true);
  });
});

describe('Category', () => {
  it('getCategoryLabel returns correct German labels', () => {
    expect(getCategoryLabel('performance')).toBe('Performance');
    expect(getCategoryLabel('skill')).toBe('Skill');
    expect(getCategoryLabel('learning')).toBe('Learning');
    expect(getCategoryLabel('career')).toBe('Karriere');
  });

  it('getCategoryLabel returns input for unknown category', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown');
  });

  it('getCategoryClassName returns correct badge classes', () => {
    expect(getCategoryClassName('performance')).toBe('badge-green');
    expect(getCategoryClassName('skill')).toBe('badge-blue');
    expect(getCategoryClassName('learning')).toBe('badge-yellow');
    expect(getCategoryClassName('career')).toBe('badge-gray');
  });

  it('getCategoryClassName returns badge-gray for unknown category', () => {
    expect(getCategoryClassName('unknown')).toBe('badge-gray');
  });
});

describe('Constants', () => {
  it('has correct values', () => {
    expect(MAX_OKRS_PER_QUARTER).toBe(5);
    expect(MAX_FOCUS).toBe(2);
    expect(CHECKIN_INTERVAL_DAYS).toBe(14);
    expect(TARGET_SCORE).toBe(0.7);
    expect(MIN_OKRS_FOR_LEVEL_UP).toBe(4);
  });
});
