import { useMutation } from "@tanstack/react-query";
import type { AISuggestRequest, AISuggestResponse } from "@/lib/ai/types";

async function fetchSuggestions(
  request: AISuggestRequest
): Promise<AISuggestResponse> {
  const response = await fetch("/api/ai/suggest-kpis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || `Fehler beim Laden der KPI-Vorschläge (${response.status})`
    );
  }

  return response.json();
}

export function useSuggestKPIs() {
  return useMutation({
    mutationFn: fetchSuggestions,
    retry: 1,
    retryDelay: 1000,
  });
}
