"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function DataPreloader() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Parallel prefetch all data when dashboard loads
    const prefetchData = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ["okrs"],
          queryFn: async () => {
            const res = await fetch("/api/okrs");
            if (!res.ok) throw new Error("Failed to prefetch OKRs");
            return res.json();
          },
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["currentUser"],
          queryFn: async () => {
            const res = await fetch("/api/auth/me");
            if (!res.ok) throw new Error("Failed to prefetch user");
            return res.json();
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["careerProgress"],
          queryFn: async () => {
            const res = await fetch("/api/career");
            if (!res.ok) throw new Error("Failed to prefetch career");
            return res.json();
          },
          staleTime: 10 * 60 * 1000,
        }),
      ]);
    };

    prefetchData();
  }, [queryClient]);

  return null;
}
