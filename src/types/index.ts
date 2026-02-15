// ===== User & Org =====
export type UserRole = 'employee' | 'manager' | 'hr' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  manager_id: string | null;
  career_level_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
}

// ===== OKR =====
export type OKRCategory = 'performance' | 'skill' | 'learning' | 'career';
export type OKRStatus = 'on_track' | 'at_risk' | 'off_track';
export type OKRScope = 'personal' | 'team' | 'company';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface OKR {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  why_it_matters: string | null;
  quarter: string; // "Q1 2026"
  category: OKRCategory;
  progress: number; // 0-100
  status: OKRStatus;
  confidence: ConfidenceLevel;
  scope: OKRScope;
  due_date: string | null;
  is_active: boolean;
  is_focus: boolean;
  sort_order: number;
  parent_okr_id: string | null;
  team_id: string | null;
  last_checkin_at: string | null;
  next_checkin_at: string | null;
  checkin_count: number;
  key_results: KeyResult[];
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  okr_id: string;
  title: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string | null;
  progress: number;
  sort_order: number;
  source_url: string | null;
  source_label: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Check-ins =====
export type CheckInChangeType = 'progress' | 'edit';

export interface CheckIn {
  id: string;
  okr_id: string;
  user_id: string;
  progress_update: number | null;
  confidence: ConfidenceLevel | null;
  what_helped: string | null;
  what_blocked: string | null;
  next_steps: string | null;
  change_type: CheckInChangeType;
  change_details: Record<string, unknown>;
  checked_at: string;
}

// ===== Career =====
export interface CareerLevel {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  min_okrs_with_target_score: number;
  target_score_threshold: number;
  created_at: string;
}

export interface UserCareerProgress {
  id: string;
  user_id: string;
  organization_id: string;
  current_level_id: string | null;
  qualifying_okr_count: number;
  total_okrs_attempted: number;
  level_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Audit =====
export type AuditAction =
  | 'okr_create' | 'okr_update' | 'okr_delete'
  | 'okr_archive' | 'okr_restore' | 'okr_duplicate'
  | 'kr_update' | 'checkin_create'
  | 'focus_toggle' | 'career_level_up'
  | 'login' | 'logout';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ===== Request Types =====
export interface CreateOKRRequest {
  title: string;
  why_it_matters?: string;
  quarter: string;
  category: OKRCategory;
  scope?: OKRScope;
  due_date?: string;
  team_id?: string;
  key_results: Array<{
    title: string;
    start_value: number;
    target_value: number;
    unit?: string;
  }>;
}

export interface UpdateOKRRequest {
  title?: string;
  why_it_matters?: string;
  category?: OKRCategory;
  scope?: OKRScope;
  due_date?: string;
  is_active?: boolean;
  is_focus?: boolean;
  sort_order?: number;
}

export interface CreateCheckinRequest {
  confidence: ConfidenceLevel;
  what_helped?: string;
  what_blocked?: string;
  next_steps?: string;
  key_result_updates: Array<{
    id: string;
    current_value: number;
  }>;
}

export interface DuplicateOKRRequest {
  target_quarter: string;
  reset_progress: boolean;
  copy_key_results: boolean;
}

// ===== Filter Types =====
export type OKRFilterType = 'all' | 'performance' | 'skill' | 'learning' | 'career' | 'focus' | 'archive';
