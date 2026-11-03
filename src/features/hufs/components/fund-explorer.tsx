import { ChevronLeft, ChevronRight, ChevronRight as Go } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { FundFilters, type FundFilterValues } from '@/features/hufs/components/fund-filters';
import { inr } from '@/features/hufs/portfolio';
import type { HufFundList, HufFundQuery, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '').trim();

/** The fund list's filters, read from the URL. */
export function fundQueryOf(sp: SearchParams): { values: FundFilterValues; query: HufFundQuery } {
  const values: FundFilterValues = {
    search: first(sp['search']).slice(0, 80), assetClass: first(sp['assetClass']), category: first(sp['category']),
    fundHouse: first(sp['fundHouse']), plan: first(sp['plan']), option: first(sp['option']), sip: first(sp['sip']) === '1',
  };
  const page = Math.max(1, Math.floor(Number(first(sp['page'])) || 1));
  const { sip, ...rest } = values;
  return { values, query: { ...rest, ...(sip ? { sip: '1' as const } : {}), page, limit: 25 } };
}

/** "Equity · Flexi Cap Fund · Direct · Growth". */
export const fundTags = (s: HufScheme) => [s.category ?? s.assetClass ?? (s.type ? s.type[0] + s.type.slice(1).toLowerCase() : null), s.planName, s.option].filter(Boolean).join(' · ');

const navDateText = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(`${/^\d{2}-\d{2}-\d{4}$/.test(iso) ? iso.split('-').reverse().join('-') : iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

function FundRow({ fund, href, held }: { fund: HufScheme; href: string; held: boolean }): React.JSX.Element {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-sunken">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[12px] font-bold text-brand-deep" aria-hidden>
          {fund.amcName.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{fundName(fund)}</span>
            {held ? <Badge tone="success">Held</Badge> : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
            {fund.amcName} · {fundTags(fund)}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="tabular block text-[13px] font-semibold text-ink">{fund.nav ? `₹${fund.nav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : '—'}</span>
          <span className="block text-[11.5px] text-ink-muted">NAV{fund.navDate ? ` · ${navDateText(fund.navDate)}` : ''}</span>
        </span>
        <span className="hidden w-28 shrink-0 text-right md:block">
          <span className="tabular block text-[13px] font-medium text-ink">{inr(fund.minFresh)}</span>
          <span className="block text-[11.5px] text-ink-muted">{fund.sipMonthly ? `SIP from ${inr(fund.sipMonthly.minAmount)}` : 'No SIP'}</span>
        </span>
        <Go className="size-4 shrink-0 text-ink-muted group-hover:text-brand" />
      </Link>
    </li>
  );
}

/**
 * Every fund open for purchase on NSE, searched and filtered, a page at a time. `hrefFor` decides where a fund
 * leads: its own screen, or the next step of an investment.
 */
export function FundExplorer({ list, values, hrefFor, pageHref, held, extra }: {
  list: HufFundList;
  values: FundFilterValues;
  hrefFor: (code: string) => string;
  pageHref: (page: number) => string;
  held: Set<string>;
  extra?: Record<string, string>;
}): React.JSX.Element {
  const from = (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.total, list.page * list.pageSize);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  return (
    <div className="space-y-4">
      <FundFilters values={values} facets={list.facets} {...(extra ? { extra } : {})} />
      {!list.categorised ? (
        <p className="text-[12.5px] text-ink-muted">AMFI&apos;s categories couldn&apos;t be read just now, so funds show NSE&apos;s broad type only.</p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line bg-surface-sunken px-4 py-2.5 text-[12.5px] text-ink-muted">
          <span>
            {list.total ? (
              <>
                <span className="tabular font-semibold text-ink">{from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')}</span> of{' '}
                <span className="tabular font-semibold text-ink">{list.total.toLocaleString('en-IN')}</span> funds
              </>
            ) : (
              'No funds'
            )}
            {list.total !== list.catalogue ? ` (of ${list.catalogue.toLocaleString('en-IN')} open for purchase on NSE)` : ' open for purchase on NSE'}
          </span>
          <span className="hidden sm:inline">NAV · Min. first purchase</span>
        </div>
        {list.items.length ? (
          <ul className="divide-y divide-line">
            {list.items.map((f) => (
              <FundRow key={f.schemeCode} fund={f} href={hrefFor(f.schemeCode)} held={held.has(f.schemeCode)} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-12 text-center text-[13px] text-ink-muted">No fund open for purchase matches these filters.</p>
        )}
      </div>
      {pages > 1 ? (
        <nav className="flex items-center justify-between text-[13px]" aria-label="Pages">
          <PageLink href={list.page > 1 ? pageHref(list.page - 1) : null}>
            <ChevronLeft className="size-4" /> Previous
          </PageLink>
          <span className="tabular text-ink-muted">
            Page {list.page.toLocaleString('en-IN')} of {pages.toLocaleString('en-IN')}
          </span>
          <PageLink href={list.page < pages ? pageHref(list.page + 1) : null}>
            Next <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }): React.JSX.Element {
  const cls = 'inline-flex h-8 items-center gap-1 rounded-md border border-line-strong px-3 font-medium';
  return href ? (
    <Link href={href} scroll={false} className={cn(cls, 'bg-surface text-ink hover:bg-surface-sunken')}>
      {children}
    </Link>
  ) : (
    <span className={cn(cls, 'cursor-not-allowed text-ink-muted opacity-50')}>{children}</span>
  );
}

/** The current URL's filters with another page. */
export function pageHrefOf(base: string, values: FundFilterValues, extra: Record<string, string> = {}) {
  return (page: number) => {
    const p = new URLSearchParams(extra);
    for (const [k, v] of Object.entries(values)) {
      if (k === 'sip') { if (v) p.set('sip', '1'); }
      else if (v) p.set(k, String(v));
    }
    if (page > 1) p.set('page', String(page));
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };
}

const Upper = new Set(['ETF', 'ELSS', 'IDCW', 'PSU', 'FOF', 'UTI', 'SBI', 'HDFC', 'ICICI', 'DSP', 'LIC', 'HSBC', 'PGIM', 'IDFC', 'ITI', 'JM', 'BOI', 'NJ', 'WOC', 'II', 'III', 'IV', 'US', 'S&P', 'MNC', 'ESG', 'CPSE', 'BSE', 'NSE']);

/** The fund's name as people write it: AMFI's, or NSE's capitals turned to title case. */
export function fundName(s: Pick<HufScheme, 'name' | 'displayName'>): string {
  if (s.displayName) return s.displayName;
  return s.name
    .split(/(\s+|-|\/|\()/)
    .map((w) => (Upper.has(w) || /\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()))
    .join('');
}

/** NSE's "15:00:00" as "3 PM", "14:30:00" as "2:30 PM". */
export function cutoffText(v: string | null | undefined): string {
  const m = String(v ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return v || '';
  const h = Number(m[1]);
  return `${h % 12 || 12}${m[2] === '00' ? '' : `:${m[2]}`} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "2026-11-02" or "02-11-2026" as "2 Nov 2026". */
export function navDateLong(v: string | null | undefined): string {
  const s = String(v ?? '');
  const iso = /^\d{2}-\d{2}-\d{4}$/.test(s) ? s.split('-').reverse().join('-') : s;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
