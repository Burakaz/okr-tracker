import type { OKRStatus, KeyResult, ConfidenceLevel } from '@/types';

// Constants
export const MAX_OKRS_PER_QUARTER = 5;
export const RECOMMENDED_OKRS = 3;
export const MAX_FOCUS = 2;
export const CHECKIN_INTERVAL_DAYS = 14;
export const TARGET_SCORE = 0.7;
export const MIN_OKRS_FOR_LEVEL_UP = 4;

// ===== Quarter Helpers =====
export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
}

export function getNextQuarter(quarter?: string): string {
  const current = quarter || getCurrentQuarter();
  const match = current.match(/Q(\d) (\d{4})/);
  if (!match) return getCurrentQuarter();

  const q = parseInt(match[1]);
  const year = parseInt(match[2]);

  if (q === 4) return `Q1 ${year + 1}`;
  return `Q${q + 1} ${year}`;
}

export function getPreviousQuarter(quarter?: string): string {
  const current = quarter || getCurrentQuarter();
  const match = current.match(/Q(\d) (\d{4})/);
  if (!match) return getCurrentQuarter();

  const q = parseInt(match[1]);
  const year = parseInt(match[2]);

  if (q === 1) return `Q4 ${year - 1}`;
  return `Q${q - 1} ${year}`;
}

export function getQuarterDateRange(quarter: string): { start: Date; end: Date } {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) {
    const now = new Date();
    return { start: now, end: now };
  }

  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const startMonth = (q - 1) * 3;

  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // Last day of quarter

  return { start, end };
}

export function getAvailableQuarters(): Array<{ value: string; label: string; isCurrent: boolean }> {
  const current = getCurrentQuarter();
  const prev = getPreviousQuarter(current);
  const next = getNextQuarter(current);

  return [
    { value: prev, label: prev, isCurrent: false },
    { value: current, label: current, isCurrent: true },
    { value: next, label: next, isCurrent: false },
  ];
}

// ===== Score & Progress =====
export function progressToScore(progress: number): number {
  return Math.round((progress / 100) * 10) / 10; // 0.0 - 1.0 with one decimal
}

export function scoreToProgress(score: number): number {
  return Math.round(score * 100);
}

export function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  bgColor: string;
  className: string;
} {
  if (score >= 0.7) {
    return { label: 'Erfolgreich', color: '#16a34a', bgColor: '#dcfce7', className: 'badge-green' };
  }
  if (score >= 0.4) {
    return { label: 'Teilweise erreicht', color: '#a16207', bgColor: '#fef9c3', className: 'badge-yellow' };
  }
  return { label: 'Nicht erreicht', color: '#dc2626', bgColor: '#fee2e2', className: 'badge-red' };
}

// ===== Status Calculation =====
export function calculateExpectedProgress(createdAt: string, dueDate: string): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(dueDate).getTime();
  const now = Date.now();

  if (now >= end) return 100;
  if (now <= start) return 0;

  const totalDuration = end - start;
  const elapsed = now - start;

  // Google standard: expect 80% of linear progress (ambitious targets)
  return Math.round((elapsed / totalDuration) * 80);
}

export function calculateStatus(
  actualProgress: number,
  createdAt: string,
  dueDate: string
): OKRStatus {
  const expected = calculateExpectedProgress(createdAt, dueDate);
  const diff = actualProgress - expected;

  if (diff >= -10) return 'on_track';
  if (diff >= -30) return 'at_risk';
  return 'off_track';
}

export function getStatusLabel(status: OKRStatus): string {
  switch (status) {
    case 'on_track': return 'Im Plan';
    case 'at_risk': return 'Gefährdet';
    case 'off_track': return 'Kritisch';
  }
}

export function getStatusClassName(status: OKRStatus): string {
  switch (status) {
    case 'on_track': return 'badge-green';
    case 'at_risk': return 'badge-yellow';
    case 'off_track': return 'badge-red';
  }
}

// ===== OKR Progress =====
export function calculateOKRProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;
  const total = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
  return Math.round(total / keyResults.length);
}

export function calculateKRProgress(current: number, start: number, target: number): number {
  if (target === start) return current >= target ? 100 : 0;
  return Math.max(0, Math.round(((current - start) / (target - start)) * 100));
}

// ===== Confidence =====
export function getConfidenceLabel(value: ConfidenceLevel): string {
  switch (value) {
    case 1: return 'Wird nicht erreicht';
    case 2: return 'Unwahrscheinlich';
    case 3: return 'Möglich';
    case 4: return 'Wahrscheinlich';
    case 5: return 'Wird erreicht';
  }
}

export function getConfidenceColor(value: ConfidenceLevel): string {
  switch (value) {
    case 1: return 'badge-red';
    case 2: return 'badge-red';
    case 3: return 'badge-yellow';
    case 4: return 'badge-green';
    case 5: return 'badge-green';
  }
}

// ===== Check-in =====
export function isCheckinOverdue(nextCheckinAt: string | null): boolean {
  if (!nextCheckinAt) return false;
  return new Date(nextCheckinAt) < new Date();
}

export function getCheckinDaysRemaining(nextCheckinAt: string | null): number | null {
  if (!nextCheckinAt) return null;
  const diff = new Date(nextCheckinAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ===== Limits =====
export function canAddFocus(currentFocusCount: number): boolean {
  return currentFocusCount < MAX_FOCUS;
}

export function canCreateOKR(currentCount: number): boolean {
  return currentCount < MAX_OKRS_PER_QUARTER;
}

// ===== Career =====
export function qualifiesForLevelUp(qualifyingOKRCount: number, requiredCount: number = MIN_OKRS_FOR_LEVEL_UP): boolean {
  return qualifyingOKRCount >= requiredCount;
}

// ===== Category Helpers =====
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'performance': return 'Performance';
    case 'skill': return 'Skill';
    case 'learning': return 'Learning';
    case 'career': return 'Karriere';
    default: return category;
  }
}

export function getCategoryClassName(category: string): string {
  switch (category) {
    case 'performance': return 'badge-green';
    case 'skill': return 'badge-blue';
    case 'learning': return 'badge-yellow';
    case 'career': return 'badge-gray';
    default: return 'badge-gray';
  }
}
