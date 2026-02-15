import { describe, it, expect } from 'vitest';
import {
  createOKRSchema,
  updateOKRSchema,
  createCheckinSchema,
  duplicateOKRSchema,
} from '@/lib/validation';

describe('createOKRSchema', () => {
  const validInput = {
    title: 'Improve customer satisfaction',
    quarter: 'Q1 2026',
    category: 'performance' as const,
    key_results: [
      {
        title: 'Increase NPS from 40 to 60',
        start_value: 40,
        target_value: 60,
      },
    ],
  };

  it('accepts valid input with required fields', () => {
    const result = createOKRSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with all optional fields', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      why_it_matters: 'Customer retention is key',
      scope: 'team',
      due_date: '2026-03-31',
      team_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('defaults scope to personal', () => {
    const result = createOKRSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scope).toBe('personal');
    }
  });

  it('rejects missing title', () => {
    const { title, ...rest } = validInput;
    const result = createOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      title: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find(
        (i) => i.path[0] === 'title'
      );
      expect(titleError?.message).toBe('Titel ist erforderlich');
    }
  });

  it('rejects title exceeding 200 chars', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      title: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects why_it_matters exceeding 1000 chars', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      why_it_matters: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing quarter', () => {
    const { quarter, ...rest } = validInput;
    const result = createOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid quarter format', () => {
    const invalidQuarters = ['Q5 2026', 'Q0 2026', '2026 Q1', 'Q1-2026', 'Q12026', 'invalid'];
    for (const q of invalidQuarters) {
      const result = createOKRSchema.safeParse({
        ...validInput,
        quarter: q,
      });
      expect(result.success).toBe(false);
    }
  });

  it('quarter error message is in German', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      quarter: 'invalid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const quarterError = result.error.issues.find(
        (i) => i.path[0] === 'quarter'
      );
      expect(quarterError?.message).toBe('Ung\u00fcltiges Quartalsformat');
    }
  });

  it('accepts valid quarter formats', () => {
    for (const q of ['Q1 2026', 'Q2 2025', 'Q3 2027', 'Q4 2024']) {
      const result = createOKRSchema.safeParse({
        ...validInput,
        quarter: q,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing category', () => {
    const { category, ...rest } = validInput;
    const result = createOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      category: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    for (const cat of ['performance', 'skill', 'learning', 'career']) {
      const result = createOKRSchema.safeParse({
        ...validInput,
        category: cat,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid scopes', () => {
    for (const scope of ['personal', 'team', 'company']) {
      const result = createOKRSchema.safeParse({
        ...validInput,
        scope,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid scope', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      scope: 'global',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty key_results array', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const krError = result.error.issues.find(
        (i) => i.path[0] === 'key_results'
      );
      expect(krError?.message).toBe('Mindestens ein Key Result erforderlich');
    }
  });

  it('rejects more than 5 key results', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: Array.from({ length: 6 }, (_, i) => ({
        title: `KR ${i + 1}`,
        start_value: 0,
        target_value: 100,
      })),
    });
    expect(result.success).toBe(false);
  });

  it('accepts up to 5 key results', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: Array.from({ length: 5 }, (_, i) => ({
        title: `KR ${i + 1}`,
        start_value: 0,
        target_value: 100,
      })),
    });
    expect(result.success).toBe(true);
  });

  it('rejects key result with empty title', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: [
        { title: '', start_value: 0, target_value: 100 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const krTitleError = result.error.issues.find(
        (i) => i.path.includes('title') && i.path[0] === 'key_results'
      );
      expect(krTitleError?.message).toBe('KR-Titel ist erforderlich');
    }
  });

  it('rejects key result with missing target_value', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: [
        { title: 'Some KR', start_value: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('defaults key result start_value to 0', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: [
        { title: 'Some KR', target_value: 100 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key_results[0].start_value).toBe(0);
    }
  });

  it('accepts key result with optional unit', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      key_results: [
        { title: 'Revenue', start_value: 0, target_value: 1000, unit: 'EUR' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid team_id format', () => {
    const result = createOKRSchema.safeParse({
      ...validInput,
      team_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing key_results entirely', () => {
    const { key_results, ...rest } = validInput;
    const result = createOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('updateOKRSchema', () => {
  it('accepts valid partial update', () => {
    const result = updateOKRSchema.safeParse({
      title: 'Updated title',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields updated)', () => {
    const result = updateOKRSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts all fields at once', () => {
    const result = updateOKRSchema.safeParse({
      title: 'New title',
      why_it_matters: 'Important reason',
      category: 'skill',
      scope: 'team',
      due_date: '2026-06-30',
      is_active: false,
      sort_order: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = updateOKRSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 chars', () => {
    const result = updateOKRSchema.safeParse({
      title: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('accepts nullable why_it_matters', () => {
    const result = updateOKRSchema.safeParse({
      why_it_matters: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects why_it_matters exceeding 1000 chars', () => {
    const result = updateOKRSchema.safeParse({
      why_it_matters: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = updateOKRSchema.safeParse({
      category: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid categories', () => {
    for (const cat of ['performance', 'skill', 'learning', 'career']) {
      const result = updateOKRSchema.safeParse({ category: cat });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid scope', () => {
    const result = updateOKRSchema.safeParse({
      scope: 'global',
    });
    expect(result.success).toBe(false);
  });

  it('accepts nullable due_date', () => {
    const result = updateOKRSchema.safeParse({
      due_date: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts boolean is_active', () => {
    const result = updateOKRSchema.safeParse({
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean is_active', () => {
    const result = updateOKRSchema.safeParse({
      is_active: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('accepts numeric sort_order', () => {
    const result = updateOKRSchema.safeParse({
      sort_order: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric sort_order', () => {
    const result = updateOKRSchema.safeParse({
      sort_order: 'first',
    });
    expect(result.success).toBe(false);
  });
});

describe('createCheckinSchema', () => {
  const validCheckin = {
    confidence: 3,
    key_result_updates: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        current_value: 50,
      },
    ],
  };

  it('accepts valid check-in with required fields', () => {
    const result = createCheckinSchema.safeParse(validCheckin);
    expect(result.success).toBe(true);
  });

  it('accepts valid check-in with all optional fields', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      what_helped: 'Team collaboration',
      what_blocked: 'Unclear requirements',
      next_steps: 'Schedule alignment meeting',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing confidence', () => {
    const { confidence, ...rest } = validCheckin;
    const result = createCheckinSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects confidence below 1', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      confidence: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence above 5', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      confidence: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer confidence', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      confidence: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid confidence levels (1-5)', () => {
    for (let i = 1; i <= 5; i++) {
      const result = createCheckinSchema.safeParse({
        ...validCheckin,
        confidence: i,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects what_helped exceeding 2000 chars', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      what_helped: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects what_blocked exceeding 2000 chars', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      what_blocked: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects next_steps exceeding 2000 chars', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      next_steps: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty key_result_updates array', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects key_result_updates with invalid UUID', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [
        { id: 'not-a-uuid', current_value: 50 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects key_result_updates with missing current_value', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts multiple key_result_updates', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [
        { id: '550e8400-e29b-41d4-a716-446655440000', current_value: 50 },
        { id: '550e8400-e29b-41d4-a716-446655440001', current_value: 75 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative current_value', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [
        { id: '550e8400-e29b-41d4-a716-446655440000', current_value: -10 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts decimal current_value', () => {
    const result = createCheckinSchema.safeParse({
      ...validCheckin,
      key_result_updates: [
        { id: '550e8400-e29b-41d4-a716-446655440000', current_value: 3.14 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('duplicateOKRSchema', () => {
  const validDuplicate = {
    target_quarter: 'Q2 2026',
    reset_progress: true,
    copy_key_results: true,
  };

  it('accepts valid duplicate request', () => {
    const result = duplicateOKRSchema.safeParse(validDuplicate);
    expect(result.success).toBe(true);
  });

  it('rejects missing target_quarter', () => {
    const { target_quarter, ...rest } = validDuplicate;
    const result = duplicateOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid target_quarter format', () => {
    const invalidQuarters = ['Q5 2026', 'Q0 2026', '2026 Q1', 'Q1-2026', 'invalid'];
    for (const q of invalidQuarters) {
      const result = duplicateOKRSchema.safeParse({
        ...validDuplicate,
        target_quarter: q,
      });
      expect(result.success).toBe(false);
    }
  });

  it('accepts valid quarter formats', () => {
    for (const q of ['Q1 2025', 'Q2 2026', 'Q3 2027', 'Q4 2028']) {
      const result = duplicateOKRSchema.safeParse({
        ...validDuplicate,
        target_quarter: q,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing reset_progress', () => {
    const { reset_progress, ...rest } = validDuplicate;
    const result = duplicateOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean reset_progress', () => {
    const result = duplicateOKRSchema.safeParse({
      ...validDuplicate,
      reset_progress: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing copy_key_results', () => {
    const { copy_key_results, ...rest } = validDuplicate;
    const result = duplicateOKRSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean copy_key_results', () => {
    const result = duplicateOKRSchema.safeParse({
      ...validDuplicate,
      copy_key_results: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts both false values', () => {
    const result = duplicateOKRSchema.safeParse({
      target_quarter: 'Q3 2026',
      reset_progress: false,
      copy_key_results: false,
    });
    expect(result.success).toBe(true);
  });
});
