"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook that sets up Supabase Realtime subscription and invalidates React Query on changes
 *
 * This provides automatic cache invalidation when database changes occur,
 * giving a live/instant feel to the UI without manual refreshes.
 */
export function useRealtimeQueryInvalidation(
  table: string,
  queryKeys: string[][],
  options?: {
    schema?: string;
    filter?: string;
    enabled?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { schema = "public", filter, enabled = true } = options || {};

  const invalidateQueries = useCallback(() => {
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient, queryKeys]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-invalidate:${schema}:${table}${filter ? `:${filter}` : ""}`;

    const subscriptionConfig: {
      event: "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event: "*",
      schema,
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", subscriptionConfig, () => {
        // Any change to this table triggers a refetch
        invalidateQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, schema, filter, enabled, invalidateQueries]);
}

/**
 * Set up realtime invalidation for OKR-related tables
 */
export function useOKRsRealtime(enabled = true) {
  // When okrs change, invalidate the OKR queries
  useRealtimeQueryInvalidation("okrs", [["okrs"]], { enabled });

  // When key_results change, also invalidate OKRs (since KRs are nested in OKR data)
  useRealtimeQueryInvalidation("key_results", [["okrs"]], { enabled });

  // When checkins change, invalidate both OKRs and checkins
  useRealtimeQueryInvalidation("okr_checkins", [["okrs"], ["checkins"]], { enabled });
}

/**
 * Set up realtime invalidation for admin data
 */
export function useAdminRealtime(enabled = true) {
  useRealtimeQueryInvalidation("profiles", [["users"]], { enabled });
  useRealtimeQueryInvalidation("career_levels", [["careerLevels"]], { enabled });
}
