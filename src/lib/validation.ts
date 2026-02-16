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
  is_focus: z.boolean().optional(),
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

// ===== Learning Schemas =====
export const courseCategoryEnum = z.enum([
  "design", "development", "marketing", "leadership",
  "data", "communication", "product", "other",
]);

export const courseDifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);

export const createCourseSchema = z.object({
  title: z.string().min(1, "Kursname ist erforderlich").max(200),
  description: z.string().max(2000).optional(),
  provider: z.string().max(100).optional().default("Intern"),
  category: courseCategoryEnum,
  estimated_duration_minutes: z.number().int().min(5).max(10000),
  difficulty: courseDifficultyEnum.optional().default("beginner"),
  external_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).max(10).optional(),
  modules: z
    .array(
      z.object({
        title: z.string().min(1, "Modulname ist erforderlich").max(200),
        description: z.string().max(1000).optional(),
        estimated_minutes: z.number().int().min(1).max(600).optional(),
      })
    )
    .min(1, "Mindestens ein Modul erforderlich")
    .max(50),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  provider: z.string().max(100).optional(),
  category: courseCategoryEnum.optional(),
  estimated_duration_minutes: z.number().int().min(5).max(10000).optional(),
  difficulty: courseDifficultyEnum.optional(),
  external_url: z.string().url().optional().nullable(),
  is_published: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const enrollCourseSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["in_progress", "completed", "paused", "dropped"]).optional(),
  notes: z.string().max(500).optional().nullable(),
});
