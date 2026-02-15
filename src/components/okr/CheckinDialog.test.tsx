import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckinDialog } from './CheckinDialog';
import type { OKR } from '@/types';

// ── Test Data ──────────────────────────────────────────────────────────────

const mockOKR: OKR = {
  id: 'okr-1',
  user_id: 'user-1',
  organization_id: 'org-1',
  title: 'Improve Customer Satisfaction',
  why_it_matters: null,
  quarter: 'Q1 2026',
  category: 'performance',
  progress: 50,
  status: 'on_track',
  confidence: 3,
  scope: 'personal',
  due_date: '2026-03-31',
  is_active: true,
  is_focus: false,
  sort_order: 0,
  parent_okr_id: null,
  team_id: null,
  last_checkin_at: null,
  next_checkin_at: null,
  checkin_count: 0,
  key_results: [
    {
      id: 'kr-1',
      okr_id: 'okr-1',
      title: 'Increase NPS',
      start_value: 0,
      target_value: 100,
      current_value: 50,
      unit: 'points',
      progress: 50,
      sort_order: 0,
      source_url: null,
      source_label: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CheckinDialog', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  it('renders the dialog with OKR title', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(
      screen.getByText('Improve Customer Satisfaction')
    ).toBeInTheDocument();
  });

  it('renders key result update section', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(
      screen.getByText('Key Results aktualisieren')
    ).toBeInTheDocument();
    expect(screen.getByText('Increase NPS')).toBeInTheDocument();
  });

  it('renders confidence selector with 5 levels', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByText('Zuversicht')).toBeInTheDocument();

    // 5 confidence level buttons
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('shows the current confidence label', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Default confidence is 3 (from OKR) = "Möglich"
    expect(screen.getByText('Möglich')).toBeInTheDocument();
  });

  it('changes confidence label when clicking a different level', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Click confidence level 5
    fireEvent.click(screen.getByText('5'));
    expect(screen.getByText('Wird erreicht')).toBeInTheDocument();

    // Click confidence level 1
    fireEvent.click(screen.getByText('1'));
    expect(screen.getByText('Wird nicht erreicht')).toBeInTheDocument();
  });

  it('renders reflection text areas', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByText('Was lief gut?')).toBeInTheDocument();
    expect(screen.getByText('Was hat blockiert?')).toBeInTheDocument();
    expect(screen.getByText('Nächste Schritte')).toBeInTheDocument();
  });

  it('renders placeholders for text areas', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(
      screen.getByPlaceholderText('Erfolge und positive Entwicklungen...')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Hindernisse und Herausforderungen...')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Geplante Aktionen...')
    ).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Click on the overlay (the outer div with modal-overlay class)
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with form data when submitted', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Click submit
    fireEvent.click(screen.getByText('Check-in speichern'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        confidence: 3,
        key_result_updates: expect.arrayContaining([
          expect.objectContaining({
            id: 'kr-1',
            current_value: 50,
          }),
        ]),
      })
    );
  });

  it('includes text fields in submission when filled', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Fill in text areas
    fireEvent.change(
      screen.getByPlaceholderText('Erfolge und positive Entwicklungen...'),
      { target: { value: 'Good progress' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Hindernisse und Herausforderungen...'),
      { target: { value: 'Some blockers' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Geplante Aktionen...'),
      { target: { value: 'Next steps here' } }
    );

    fireEvent.click(screen.getByText('Check-in speichern'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        what_helped: 'Good progress',
        what_blocked: 'Some blockers',
        next_steps: 'Next steps here',
      })
    );
  });

  it('shows loading state on submit button', () => {
    render(
      <CheckinDialog
        okr={mockOKR}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('Speichern...')).toBeInTheDocument();
    const submitBtn = screen.getByText('Speichern...');
    expect(submitBtn).toBeDisabled();
  });

  it('shows default submit text when not loading', () => {
    render(
      <CheckinDialog
        okr={mockOKR}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={false}
      />
    );

    expect(screen.getByText('Check-in speichern')).toBeInTheDocument();
  });

  it('renders without key results section when OKR has none', () => {
    const okrNoKR = { ...mockOKR, key_results: [] };
    render(
      <CheckinDialog okr={okrNoKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(
      screen.queryByText('Key Results aktualisieren')
    ).not.toBeInTheDocument();
  });

  it('displays KR unit when provided', () => {
    render(
      <CheckinDialog okr={mockOKR} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByText('points')).toBeInTheDocument();
  });
});
