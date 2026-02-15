import { z } from "zod";

export const createOKRSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  why_it_matters: z.string().max(1000).optional(),
  quarter: z.string().regex(/^Q[1-4] \d{4}$/, "Ungültiges Quartalsformat"),
  category: z.enum(["performance", "skill", "learning", "career"]),
  scope: z.enum(["personal", "team", "company"]).optional().default("personal"),
  due_date: z.string().optional(),
  team_id: z.string().uuid().optional(),
  key_results: z
    .array(
      z.object({
        title: z.string().min(1, "KR-Titel ist erforderlich"),
        start_value: z.number().default(0),
        target_value: z.number(),
        unit: z.string().optional(),
      })
    )
    .min(1, "Mindestens ein Key Result erforderlich")
    .max(5),
});

export const updateOKRSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  why_it_matters: z.string().max(1000).optional().nullable(),
  category: z.enum(["performance", "skill", "learning", "career"]).optional(),
  scope: z.enum(["personal", "team", "company"]).optional(),
  due_date: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export const createCheckinSchema = z.object({
  confidence: z.number().int().min(1).max(5),
  what_helped: z.string().max(2000).optional(),
  what_blocked: z.string().max(2000).optional(),
  next_steps: z.string().max(2000).optional(),
  key_result_updates: z.array(
    z.object({
      id: z.string().uuid(),
      current_value: z.number(),
    })
  ),
});

export const duplicateOKRSchema = z.object({
  target_quarter: z.string().regex(/^Q[1-4] \d{4}$/),
  reset_progress: z.boolean(),
  copy_key_results: z.boolean(),
});
