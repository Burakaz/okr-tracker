"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function DataPreloader() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Parallel prefetch all data when dashboard loads
    const prefetchData = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["okrs"],
          queryFn: () => fetch("/api/okrs").then((r) => r.json()),
        }),
        queryClient.prefetchQuery({
          queryKey: ["currentUser"],
          queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
        }),
        queryClient.prefetchQuery({
          queryKey: ["careerLevels"],
          queryFn: () => fetch("/api/career/levels").then((r) => r.json()),
        }),
      ]);
    };

    prefetchData();
  }, [queryClient]);

  return null;
}
