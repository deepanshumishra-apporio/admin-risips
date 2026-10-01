import type { BadgeTone } from '@/components/ui/badge';
import type { TicketCategory, TicketChannel, TicketPriority, TicketStatus } from '@/types/admin-api.types';

export const TicketStatuses: readonly TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_INVESTOR', 'RESOLVED', 'CLOSED'];
export const TicketPriorities: readonly TicketPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
export const TicketCategories: readonly TicketCategory[] = [
  'KYC', 'SIP_MANDATE', 'ORDER', 'REDEMPTION', 'PAYMENT', 'STATEMENT', 'ACCOUNT', 'OTHER',
];

export const StatusLabel: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  WAITING_ON_INVESTOR: 'Waiting on investor',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const StatusTone: Record<TicketStatus, BadgeTone> = {
  OPEN: 'brand',
  IN_PROGRESS: 'violet',
  WAITING_ON_INVESTOR: 'warn',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export const PriorityLabel: Record<TicketPriority, string> = { URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal', LOW: 'Low' };

export const PriorityTone: Record<TicketPriority, BadgeTone> = { URGENT: 'danger', HIGH: 'warn', NORMAL: 'neutral', LOW: 'neutral' };

/** Resolution targets, mirrored from the API so the form can say what a priority commits to. */
export const SlaHours: Record<TicketPriority, number> = { URGENT: 4, HIGH: 24, NORMAL: 48, LOW: 72 };

export const CategoryLabel: Record<TicketCategory, string> = {
  KYC: 'KYC',
  SIP_MANDATE: 'SIP / mandate',
  ORDER: 'Order',
  REDEMPTION: 'Redemption',
  PAYMENT: 'Payment',
  STATEMENT: 'Statement',
  ACCOUNT: 'Account',
  OTHER: 'Other',
};

export const ChannelLabel: Record<TicketChannel, string> = { APP: 'App', CHAT: 'Chat', PHONE: 'Phone', EMAIL: 'Email' };

/** A ticket history row in words. */
export function eventText(type: string, from: string | null, to: string | null): string {
  const status = (value: string | null) => (value && value in StatusLabel ? StatusLabel[value as TicketStatus] : value ?? '—');
  switch (type) {
    case 'CREATED':
      return `raised the ticket${to ? ` via ${ChannelLabel[to as TicketChannel] ?? to}` : ''}`;
    case 'STATUS':
      return `changed status ${status(from)} → ${status(to)}`;
    case 'PRIORITY':
      return `changed priority ${PriorityLabel[from as TicketPriority] ?? from} → ${PriorityLabel[to as TicketPriority] ?? to}`;
    case 'CATEGORY':
      return `changed category ${CategoryLabel[from as TicketCategory] ?? from} → ${CategoryLabel[to as TicketCategory] ?? to}`;
    case 'ASSIGNED':
      return to ? `assigned it to ${to}` : `unassigned ${from ?? 'it'}`;
    default:
      return type.toLowerCase();
  }
}
