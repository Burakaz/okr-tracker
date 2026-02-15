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

export function useToggleFocus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/okrs/${id}/focus`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fehler beim Fokus-Toggle");
      }
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
