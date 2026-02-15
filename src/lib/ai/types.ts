import { z } from "zod";

// Schema for a single suggested Key Result
export const suggestedKRSchema = z.object({
  title: z.string().min(1).max(200),
  start_value: z.number().min(0),
  target_value: z.number().min(0),
  unit: z.string().min(1).max(50),
});

// Schema for the AI response
export const aiSuggestResponseSchema = z.object({
  suggestions: z.array(suggestedKRSchema).min(1).max(5),
});

// TypeScript types derived from schemas
export type SuggestedKR = z.infer<typeof suggestedKRSchema>;
export type AISuggestResponse = z.infer<typeof aiSuggestResponseSchema>;

// Request type for the API
export interface AISuggestRequest {
  okr_title: string;
  category: "performance" | "skill" | "learning" | "career";
  existing_krs?: string[];
}
