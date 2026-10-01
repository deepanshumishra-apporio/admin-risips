import {
  ArrowLeftRight,
  Bell,
  Bot,
  Boxes,
  CalendarCheck,
  FileBarChart,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Megaphone,
  ShieldAlert,
  UserCog,
  Users,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Permission } from '@/types/admin-api.types';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /** Hidden from staff whose roles lack it. The page checks again; this only tidies the rail. */
  permission?: Permission;
  /** Planned but not built: shown with a "Soon" tag. */
  soon?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NavSections: NavSection[] = [
  {
    title: 'Observe',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
      { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight, permission: 'transactions.read' },
      { label: 'Compliance', href: '/compliance', icon: ShieldAlert, permission: 'compliance.manage' },
      { label: 'Reports', href: '/reports', icon: FileBarChart, permission: 'reports.read' },
    ],
  },
  {
    title: 'Distribution',
    items: [
      { label: 'Investors', href: '/investors', icon: Users, permission: 'investors.read' },
      { label: 'Agents', href: '/agents', icon: UsersRound, soon: true },
      { label: 'Staff', href: '/staff', icon: UserCog, permission: 'staff.manage' },
    ],
  },
  {
    title: 'Advisory',
    items: [
      { label: 'Buckets', href: '/buckets', icon: Boxes, soon: true },
      { label: 'Model Portfolios', href: '/model-portfolios', icon: Layers },
      { label: 'Review Meetings', href: '/review-meetings', icon: CalendarCheck },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Inbox', href: '/notifications', icon: Bell, badge: 4 },
      { label: 'Announcements', href: '/announcements', icon: Megaphone, permission: 'announcements.manage' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Tickets', href: '/support', icon: LifeBuoy, permission: 'support.manage' },
      { label: 'Risip Bot', href: '/risip-bot', icon: Bot, permission: 'support.manage' },
    ],
  },
];

/** Flat lookup used by the breadcrumb to name the section it is inside. */
export const NavItemsByHref = new Map<string, NavItem>(
  NavSections.flatMap((section) => section.items).map((item) => [item.href, item]),
);

/** The sections this staff member can use; a section left empty is dropped. */
export function sectionsFor(permissions: readonly Permission[]): NavSection[] {
  return NavSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || permissions.includes(item.permission)),
  })).filter((section) => section.items.length > 0);
}
