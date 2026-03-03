"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  OKR,
  User,
  CheckIn,
  UserCareerProgress,
  CreateOKRRequest,
  UpdateOKRRequest,
  CreateCheckinRequest,
  DuplicateOKRRequest,
  Course,
  Enrollment,
  CreateCourseRequest,
  TeamLearningMember,
} from "@/types";

// ===== OKRs =====
export function useOKRs(quarter?: string) {
  return useQuery<{ okrs: OKR[] }>({
    queryKey: ["okrs", quarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (quarter) params.set("quarter", quarter);
      const res = await fetch(`/api/okrs?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden der OKRs");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useOKR(id: string) {
  return useQuery<{ okr: OKR }>({
    queryKey: ["okr", id],
    queryFn: async () => {
      const res = await fetch(`/api/okrs/${id}`);
      if (!res.ok) throw new Error("Fehler beim Laden des OKR");
      return res.json();
    },
    enabled: !!id,
  });
}

// ===== User =====
export function useCurrentUser() {
  return useQuery<{ user: User }>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Fehler beim Laden des Users");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // User data rarely changes, 5 min stale
  });
}

// ===== Check-ins =====
export function useCheckinHistory(okrId: string) {
  return useQuery<{ checkins: CheckIn[] }>({
    queryKey: ["checkins", okrId],
    queryFn: async () => {
      const res = await fetch(`/api/okrs/${okrId}/checkin`);
      if (!res.ok) throw new Error("Fehler beim Laden der Check-ins");
      return res.json();
    },
    enabled: !!okrId,
    staleTime: 2 * 60 * 1000, // 2 min stale for check-in history
  });
}

// ===== Career =====
export function useCareerProgress() {
  return useQuery<{ progress: UserCareerProgress | null }>({
    queryKey: ["careerProgress"],
    queryFn: async () => {
      const res = await fetch("/api/career");
      if (!res.ok)
        throw new Error("Fehler beim Laden des Karriere-Fortschritts");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // Career data is slow-changing, 10 min stale
  });
}

// ===== Requirement Completions =====

export interface RequirementCompletion {
  id: string;
  user_id: string;
  organization_id: string;
  career_path_id: string;
  level_id: string;
  requirement_index: number;
  status: "not_started" | "in_progress" | "completed";
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useRequirementCompletions() {
  return useQuery<{ completions: RequirementCompletion[] }>({
    queryKey: ["requirementCompletions"],
    queryFn: async () => {
      const res = await fetch("/api/career/requirements");
      if (!res.ok)
        throw new Error("Fehler beim Laden der Anforderungen");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      career_path_id: string;
      level_id: string;
      requirement_index: number;
      status: "not_started" | "in_progress" | "completed";
      notes?: string | null;
    }) => {
      const res = await fetch("/api/career/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Speichern");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirementCompletions"] });
      queryClient.invalidateQueries({ queryKey: ["careerProgress"] });
    },
  });
}

// ===== Mutations =====
export function useCreateOKR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOKRRequest) => {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Erstellen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useUpdateOKR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateOKRRequest) => {
      const res = await fetch(`/api/okrs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["okr"] });
    },
  });
}

export function useDeleteOKR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/okrs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Löschen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useArchiveOKR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const res = await fetch(`/api/okrs/${id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      });
      if (!res.ok) throw new Error("Fehler beim Archivieren");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useDuplicateOKR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & DuplicateOKRRequest) => {
      const res = await fetch(`/api/okrs/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Fehler beim Duplizieren");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
    },
  });
}

export function useCreateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      ...data
    }: { okrId: string } & CreateCheckinRequest) => {
      const res = await fetch(`/api/okrs/${okrId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Fehler beim Check-in");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["okr", variables.okrId] });
      queryClient.invalidateQueries({
        queryKey: ["checkins", variables.okrId],
      });
    },
  });
}

// ===== Organization =====
export function useOrganization() {
  return useQuery<{ organization: { id: string; name: string; slug: string; domain?: string; logo_url: string | null; created_at: string } }>({
    queryKey: ["organization"],
    queryFn: async () => {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Fehler beim Laden der Organisation");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganizationMembers() {
  return useQuery<{ members: Array<{ id: string; name: string; email: string; role: string; department: string | null; avatar_url: string | null; status: string; created_at: string }> }>({
    queryKey: ["organization", "members"],
    queryFn: async () => {
      const res = await fetch("/api/organization/members");
      if (!res.ok) throw new Error("Fehler beim Laden der Mitglieder");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; domain?: string; logo_url?: string }) => {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await fetch(`/api/organization/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "members"] });
    },
  });
}

// ===== Learnings =====
export function useCourses(filters?: {
  category?: string;
  provider?: string;
  difficulty?: string;
  search?: string;
}) {
  return useQuery<{ courses: Course[] }>({
    queryKey: ["courses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.set("category", filters.category);
      if (filters?.provider) params.set("provider", filters.provider);
      if (filters?.difficulty) params.set("difficulty", filters.difficulty);
      if (filters?.search) params.set("search", filters.search);
      const res = await fetch(`/api/courses?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Kurse");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCourse(id: string) {
  return useQuery<{ course: Course; enrollment: Enrollment | null }>({
    queryKey: ["course", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Fehler beim Laden des Kurses");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useEnrollments(status?: string) {
  return useQuery<{ enrollments: Enrollment[] }>({
    queryKey: ["enrollments", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/enrollments?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Einschreibungen");
      return res.json();
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useTeamLearnings() {
  return useQuery<{ members: TeamLearningMember[] }>({
    queryKey: ["teamLearnings"],
    queryFn: async () => {
      const res = await fetch("/api/team/learnings");
      if (!res.ok) throw new Error("Fehler beim Laden der Team-Learnings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Einschreiben");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useToggleModuleCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      courseId,
      moduleId,
    }: {
      courseId: string;
      moduleId: string;
    }) => {
      const res = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/complete`,
        { method: "POST" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCourseRequest) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Erstellen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUploadCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      enrollmentId,
      formData,
    }: {
      enrollmentId: string;
      formData: FormData;
    }) => {
      const res = await fetch(
        `/api/enrollments/${enrollmentId}/certificate`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Hochladen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useUnenroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Abmelden");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useSuggestCourses() {
  return useMutation({
    mutationFn: async (data: { goals?: string; skills?: string[] }) => {
      const res = await fetch("/api/ai/suggest-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler bei der KI-Empfehlung");
      }
      return res.json();
    },
  });
}

// ===== Redesign: New Hooks =====
export function useQuickCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      ...data
    }: {
      okrId: string;
      confidence: number;
      note?: string;
      key_result_updates?: Array<{ id: string; current_value: number }>;
    }) => {
      const res = await fetch(`/api/okrs/${okrId}/quick-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Quick Check-in");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["okr", variables.okrId] });
      queryClient.invalidateQueries({ queryKey: ["checkins", variables.okrId] });
    },
  });
}

export function useLinkCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      okrId,
      key_result_id,
      enrollment_id,
      auto_update,
    }: {
      okrId: string;
      key_result_id: string;
      enrollment_id: string;
      auto_update?: boolean;
    }) => {
      const res = await fetch(`/api/okrs/${okrId}/link-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_result_id, enrollment_id, auto_update }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Verknüpfen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useReview(quarter?: string) {
  return useQuery<{ review: import("@/types").ReviewData }>({
    queryKey: ["review", quarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (quarter) params.set("quarter", quarter);
      const res = await fetch(`/api/review?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden des Rückblicks");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAchievements() {
  return useQuery<{ achievements: import("@/types").Achievement[] }>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Fehler beim Laden der Achievements");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: string) => {
      const res = await fetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      if (!res.ok) throw new Error("Fehler beim Achievement-Check");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useSuggestKRs() {
  return useMutation({
    mutationFn: async (data: { title: string; category: string }) => {
      const res = await fetch("/api/ai/suggest-krs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler bei KR-Vorschlägen");
      }
      return res.json();
    },
  });
}

// ===== AI Motivation =====
export function useMotivation(stats: {
  name: string;
  progress: number;
  okrCount: number;
  overdueCount: number;
  daysRemaining: number;
}) {
  return useQuery<{ message: string }>({
    queryKey: ["motivation", stats.progress, stats.okrCount, stats.overdueCount],
    queryFn: async () => {
      const params = new URLSearchParams({
        name: stats.name,
        progress: String(stats.progress),
        okrCount: String(stats.okrCount),
        overdueCount: String(stats.overdueCount),
        daysRemaining: String(stats.daysRemaining),
      });
      const res = await fetch(`/api/ai/motivate?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Motivation");
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // Cache 30 min — no need for frequent AI calls
    enabled: stats.okrCount > 0,
  });
}

// ===== Team Member Detail =====
export function useTeamMemberDetail(memberId: string) {
  return useQuery<{ member: import("@/types").TeamMemberDetail }>({
    queryKey: ["teamMember", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/team/members/${memberId}`);
      if (!res.ok) throw new Error("Fehler beim Laden des Mitgliederprofils");
      return res.json();
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      ...data
    }: {
      memberId: string;
      position?: string;
      craft_focus?: string;
      career_level_id?: string | null;
      department?: string;
    }) => {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

// ===== Prefetch =====
export function usePrefetchData(quarter?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: ["okrs", quarter],
      queryFn: () =>
        fetch(`/api/okrs${quarter ? `?quarter=${quarter}` : ""}`).then((r) =>
          r.json()
        ),
    });
    queryClient.prefetchQuery({
      queryKey: ["currentUser"],
      queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
    });
    queryClient.prefetchQuery({
      queryKey: ["careerProgress"],
      queryFn: () => fetch("/api/career").then((r) => r.json()),
    });
  };
}
