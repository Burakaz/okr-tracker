import { useMutation } from "@tanstack/react-query";
import type {
  SuggestModulesRequest,
  SuggestModulesResponse,
} from "@/lib/ai/types";

async function fetchModuleSuggestions(
  request: SuggestModulesRequest
): Promise<SuggestModulesResponse> {
  const response = await fetch("/api/ai/suggest-modules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ||
        `Fehler beim Laden der Modul-Vorschlaege (${response.status})`
    );
  }

  return response.json();
}

export function useSuggestModules() {
  return useMutation({
    mutationFn: fetchModuleSuggestions,
    retry: 1,
    retryDelay: 1000,
  });
}
