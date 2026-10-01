'use client';

import { Building2, ChevronRight, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavItemsByHref } from '@/components/layout/nav-items';
import { Investors } from '@/data/investors';
import { ModelPortfolios } from '@/data/portfolios';
import { isReportKey, ReportName } from '@/features/reports/labels';

/** Sections that are reachable but deliberately absent from the nav rail. */
const OffNavSections: Record<string, { label: string; icon: LucideIcon }> = {
  profile: { label: 'Your profile', icon: UserRound },
};

/** Resolves a detail-route id to the name a human would recognise. */
function resolveLeaf(section: string, segment: string): string {
  if (section === 'investors') {
    // Live records are addressed by id; the page header carries the name.
    return Investors.find((investor) => investor.id === segment)?.name ?? 'Investor record';
  }

  if (section === 'staff') {
    return segment === 'new' ? 'Add staff member' : 'Staff member';
  }

  if (section === 'compliance') {
    return 'Alert';
  }

  if (section === 'support') {
    return segment === 'new' ? 'New ticket' : 'Ticket';
  }

  if (section === 'reports') {
    return isReportKey(segment) ? ReportName[segment] : 'Report';
  }

  if (section === 'announcements') {
    return segment === 'new' ? 'New announcement' : 'Announcement';
  }

  if (section === 'model-portfolios') {
    if (segment === 'new') return 'New portfolio';
    return ModelPortfolios.find((portfolio) => portfolio.id === segment)?.name ?? segment;
  }

  return segment;
}

export function Breadcrumbs(): React.JSX.Element {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const section = segments[0] ?? 'dashboard';
  const sectionItem = NavItemsByHref.get(`/${section}`) ?? OffNavSections[section];
  const SectionIcon = sectionItem?.icon ?? Building2;
  const leaf = segments[1];

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[14px]">
      <Link
        href={`/${section}`}
        className={leaf ? 'flex items-center gap-2 text-ink-soft hover:text-ink' : 'flex items-center gap-2 text-ink'}
      >
        <SectionIcon className="size-4 shrink-0 text-ink-muted" strokeWidth={1.9} />
        <span className="truncate font-medium">{sectionItem?.label ?? 'Dashboard'}</span>
      </Link>

      {leaf ? (
        <>
          <ChevronRight className="size-4 shrink-0 text-ink-muted" />
          <span className="truncate font-medium text-ink">{resolveLeaf(section, leaf)}</span>
        </>
      ) : null}
    </nav>
  );
}
