import {
  Building2,
  FileBarChart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Permission } from '@/types/admin-api.types';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /** Hidden from staff whose roles lack it (any one, for a list). The page checks again; this only tidies the rail. */
  permission?: Permission | Permission[];
  /** Planned but not built: shown with a "Soon" tag. */
  soon?: boolean;
};

/** One line of the menu: a page, or a group that opens to show its pages (like "Orders & SIPs"). */
export type NavGroup = { label: string; key: string; icon: LucideIcon; children: NavItem[] };
export type NavEntry = NavItem | NavGroup;

export const isGroup = (entry: NavEntry): entry is NavGroup => 'children' in entry;

/**
 * The menu, as in the design: Dashboard, Investors, Orders & SIPs, Commissions, Compliance, Reports, Roles & access,
 * plus Onboarding (HUFs and companies on NSE). Advisory, engagement and support screens are left out of the menu for
 * now (24 Nov 2026); their pages still work by address, and the bell still opens the Inbox.
 */
export const NavEntries: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { label: 'Investors', href: '/investors', icon: Users, permission: 'investors.read' },
  {
    label: 'Orders & SIPs',
    key: 'orders',
    icon: Repeat,
    children: [
      { label: 'Total AUM', href: '/orders/aum', icon: IndianRupee, permission: 'dashboard.read' },
      { label: 'Active SIPs', href: '/orders/sips', icon: Repeat, permission: 'transactions.read' },
      { label: 'Transactions', href: '/transactions', icon: Repeat, permission: 'transactions.read' },
    ],
  },
  {
    label: 'Onboarding',
    key: 'onboarding',
    icon: Landmark,
    children: [
      { label: 'HUFs', href: '/onboarding/hufs', icon: Landmark, permission: 'hufs.manage' },
      { label: 'Companies', href: '/onboarding/companies', icon: Building2, permission: 'hufs.manage' },
    ],
  },
  { label: 'Commissions', href: '/commissions', icon: IndianRupee, permission: 'reports.read', soon: true },
  { label: 'Compliance', href: '/compliance', icon: ShieldAlert, permission: 'compliance.manage' },
  { label: 'Reports', href: '/reports', icon: FileBarChart, permission: 'reports.read' },
  { label: 'Roles & access', href: '/staff', icon: ShieldCheck, permission: ['staff.manage', 'roles.manage'] },
];

const allItems = (entries: NavEntry[]): NavItem[] => entries.flatMap((e) => (isGroup(e) ? e.children : [e]));

/** Flat lookup used by the breadcrumb to name the section it is inside. */
export const NavItemsByHref = new Map<string, NavItem>(allItems(NavEntries).map((item) => [item.href, item]));

export function canSee(item: Pick<NavItem, 'permission'>, permissions: readonly Permission[]): boolean {
  if (!item.permission) return true;
  const anyOf = Array.isArray(item.permission) ? item.permission : [item.permission];
  return anyOf.some((permission) => permissions.includes(permission));
}

/** The menu this staff member can use; a group left empty is dropped. */
export function entriesFor(permissions: readonly Permission[]): NavEntry[] {
  return NavEntries.flatMap((entry): NavEntry[] => {
    if (!isGroup(entry)) return canSee(entry, permissions) ? [entry] : [];
    const children = entry.children.filter((item) => canSee(item, permissions));
    return children.length ? [{ ...entry, children }] : [];
  });
}
