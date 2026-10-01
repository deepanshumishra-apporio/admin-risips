import { TicketCategories, TicketPriorities } from '@/features/support/labels';
import type { TicketCategory, TicketListQuery, TicketPriority, TicketSummary } from '@/types/admin-api.types';

/** The queue's saved views. Each is a fixed filter; search, priority and category narrow it further. */
export const TicketViews = ['open', 'mine', 'unassigned', 'overdue', 'waiting', 'done', 'all'] as const;
export type TicketView = (typeof TicketViews)[number];

export const TicketViewLabel: Record<TicketView, string> = {
  open: 'Open',
  mine: 'Mine',
  unassigned: 'Unassigned',
  overdue: 'Overdue',
  waiting: 'Waiting on investor',
  done: 'Resolved',
  all: 'All',
};

/** Which summary count each view shows beside its name. */
export const TicketViewCount: Partial<Record<TicketView, keyof TicketSummary>> = {
  open: 'open',
  mine: 'mine',
  unassigned: 'unassigned',
  overdue: 'overdue',
  waiting: 'waitingOnInvestor',
};

export type TicketFilters = {
  view: TicketView;
  q: string;
  priority: TicketPriority | null;
  category: TicketCategory | null;
  cursor: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

export function parseTicketFilters(params: RawParams): TicketFilters {
  const view = first(params['view']) as TicketView;
  const priority = first(params['priority']).toUpperCase() as TicketPriority;
  const category = first(params['category']).toUpperCase() as TicketCategory;
  const cursor = first(params['cursor']);
  return {
    view: TicketViews.includes(view) ? view : 'open',
    q: first(params['q']).trim().slice(0, 100),
    priority: TicketPriorities.includes(priority) ? priority : null,
    category: TicketCategories.includes(category) ? category : null,
    cursor: /^[A-Za-z0-9_-]{1,200}$/.test(cursor) ? cursor : null,
  };
}

const Live = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_INVESTOR'] as const;

export function toTicketQuery(filters: TicketFilters, limit: number): TicketListQuery {
  const base: TicketListQuery = {
    limit,
    ...(filters.q && { search: filters.q }),
    ...(filters.priority && { priority: [filters.priority] }),
    ...(filters.category && { category: [filters.category] }),
    ...(filters.cursor && { cursor: filters.cursor }),
  };
  switch (filters.view) {
    case 'mine':
      return { ...base, status: [...Live], assignee: 'me' };
    case 'unassigned':
      return { ...base, status: [...Live], assignee: 'unassigned' };
    case 'overdue':
      return { ...base, overdue: true };
    case 'waiting':
      return { ...base, status: ['WAITING_ON_INVESTOR'] };
    case 'done':
      return { ...base, status: ['RESOLVED', 'CLOSED'] };
    case 'all':
      return base;
    default:
      return { ...base, status: [...Live] };
  }
}

export function ticketsHref(filters: Partial<TicketFilters>): string {
  const params = new URLSearchParams();
  if (filters.view && filters.view !== 'open') params.set('view', filters.view);
  if (filters.q) params.set('q', filters.q);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.category) params.set('category', filters.category);
  if (filters.cursor) params.set('cursor', filters.cursor);
  const text = params.toString();
  return text ? `/support?${text}` : '/support';
}
