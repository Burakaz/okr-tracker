import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OKRDetail } from './OKRDetail';
import type { OKR, CheckIn } from '@/types';

// ── Test Data ──────────────────────────────────────────────────────────────

const mockOKR: OKR = {
  id: 'okr-1',
  user_id: 'user-1',
  organization_id: 'org-1',
  title: 'Improve Customer Satisfaction',
  why_it_matters: 'Customers are our lifeblood',
  quarter: 'Q1 2026',
  category: 'performance',
  progress: 65,
  status: 'on_track',
  confidence: 4,
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
      title: 'Increase NPS from 40 to 60',
      start_value: 40,
      target_value: 60,
      current_value: 53,
      unit: 'points',
      progress: 65,
      sort_order: 0,
      source_url: null,
      source_label: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
    {
      id: 'kr-2',
      okr_id: 'okr-1',
      title: 'Reduce support tickets by 20%',
      start_value: 100,
      target_value: 80,
      current_value: 85,
      unit: null,
      progress: 75,
      sort_order: 1,
      source_url: null,
      source_label: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockHandlers = {
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onCheckin: vi.fn(),
  onArchive: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OKRDetail', () => {
  it('renders the OKR title', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(
      screen.getByText('Improve Customer Satisfaction')
    ).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('renders the quarter information', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
  });

  it('renders why_it_matters section when provided', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(
      screen.getByText('Customers are our lifeblood')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Warum ist das wichtig?')
    ).toBeInTheDocument();
  });

  it('does not render why_it_matters when null', () => {
    const okrWithoutWhy = { ...mockOKR, why_it_matters: null };
    render(<OKRDetail okr={okrWithoutWhy} {...mockHandlers} />);
    expect(
      screen.queryByText('Warum ist das wichtig?')
    ).not.toBeInTheDocument();
  });

  it('renders all key results', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(
      screen.getByText('Increase NPS from 40 to 60')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reduce support tickets by 20%')
    ).toBeInTheDocument();
  });

  it('shows key result count in header', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(screen.getByText('Key Results (2)')).toBeInTheDocument();
  });

  it('shows current/target values for key results', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    expect(screen.getByText('53 points / 60 points')).toBeInTheDocument();
    expect(screen.getByText('85 / 80')).toBeInTheDocument();
  });

  it('shows empty state when no key results', () => {
    const okrNoKR = { ...mockOKR, key_results: [] };
    render(<OKRDetail okr={okrNoKR} {...mockHandlers} />);
    expect(
      screen.getByText('Keine Key Results definiert.')
    ).toBeInTheDocument();
  });

  it('renders formatted due date', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    // German date format for 2026-03-31
    expect(screen.getByText('31.3.2026')).toBeInTheDocument();
  });

  it('shows "Kein Datum" when no due_date', () => {
    const okrNoDue = { ...mockOKR, due_date: null };
    render(<OKRDetail okr={okrNoDue} {...mockHandlers} />);
    expect(screen.getByText('Kein Datum')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const closeBtn = screen.getByLabelText('Detailansicht schließen');
    fireEvent.click(closeBtn);
    expect(mockHandlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const editBtn = screen.getByText('Bearbeiten');
    fireEvent.click(editBtn);
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onCheckin when check-in button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const checkinBtn = screen.getByText('Check-in');
    fireEvent.click(checkinBtn);
    expect(mockHandlers.onCheckin).toHaveBeenCalledTimes(1);
  });

  it('calls onArchive when archive button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const archiveBtn = screen.getByTitle('Archivieren');
    fireEvent.click(archiveBtn);
    expect(mockHandlers.onArchive).toHaveBeenCalledTimes(1);
  });

  it('calls onDuplicate when duplicate button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const dupBtn = screen.getByTitle('Duplizieren');
    fireEvent.click(dupBtn);
    expect(mockHandlers.onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<OKRDetail okr={mockOKR} {...mockHandlers} />);
    const deleteBtn = screen.getByTitle('Löschen');
    fireEvent.click(deleteBtn);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders checkin history when provided', () => {
    const checkins: CheckIn[] = [
      {
        id: 'c1',
        okr_id: 'okr-1',
        user_id: 'user-1',
        progress_update: 50,
        confidence: 4,
        what_helped: 'Great collaboration',
        what_blocked: 'Missing data',
        next_steps: 'Schedule review',
        change_type: 'progress',
        change_details: {},
        checked_at: '2026-02-01T10:00:00Z',
      },
    ];

    render(
      <OKRDetail okr={mockOKR} checkins={checkins} {...mockHandlers} />
    );

    expect(
      screen.getByText('Check-in Verlauf (1)')
    ).toBeInTheDocument();
    expect(screen.getByText('Great collaboration')).toBeInTheDocument();
    expect(screen.getByText('Missing data')).toBeInTheDocument();
    expect(screen.getByText(/Schedule review/)).toBeInTheDocument();
  });

  it('does not render checkin history when empty', () => {
    render(<OKRDetail okr={mockOKR} checkins={[]} {...mockHandlers} />);
    expect(
      screen.queryByText(/Check-in Verlauf/)
    ).not.toBeInTheDocument();
  });

  it('renders all category badge variants', () => {
    const categories = ['performance', 'skill', 'learning', 'career'] as const;
    const labels = ['Performance', 'Skill', 'Learning', 'Karriere'];

    categories.forEach((cat, i) => {
      const { unmount } = render(
        <OKRDetail
          okr={{ ...mockOKR, category: cat }}
          {...mockHandlers}
        />
      );
      expect(screen.getByText(labels[i])).toBeInTheDocument();
      unmount();
    });
  });
});
