import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { InfoHint } from '@/features/dashboard/components/info-hint';
import type { DashboardOverview } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatDateTime } from '@/utils/format';

/** A count that opens the list it counts. */
function Tile({ label, value, caption, hint, href }: { label: string; value: number; caption?: string; hint?: string; href: string }): React.JSX.Element {
  return (
    <Link href={href} className="block rounded-lg bg-surface-sunken px-3 py-2.5 transition-colors hover:bg-brand-soft">
      <p className="flex items-center gap-1 text-[12px] text-ink-soft">
        {label}
        {hint ? <InfoHint text={hint} /> : null}
      </p>
      <p className="tabular mt-1 text-[20px] leading-tight font-semibold text-ink">{formatCount(value)}</p>
      {caption ? <p className="text-[11.5px] text-ink-muted">{caption}</p> : null}
    </Link>
  );
}

function Split({ label, value, href, tone }: { label: string; value: number; href: string; tone: string }): React.JSX.Element {
  return (
    <Link href={href} className="rounded-md border border-line bg-surface px-2.5 py-1.5 transition-colors hover:border-brand/40 hover:bg-brand-soft">
      <p className="text-[11.5px] text-ink-muted">{label}</p>
      <p className={cn('tabular text-[14px] font-semibold', tone)}>{formatCount(value)}</p>
    </Link>
  );
}

/** Who the investors are: totals, families, ELSS holders, this month's new clients, and active against inactive. */
export function InvestorSummary({ investors, asOf }: { investors: DashboardOverview['investors']; asOf: string | null }): React.JSX.Element {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Investor summary"
        subtitle={asOf ? `As of ${formatDateTime(asOf)}` : undefined}
        action={
          <Link href="/dashboard" title="Refresh" aria-label="Refresh" className="inline-flex text-ink-muted hover:text-brand">
            <RefreshCw className="size-4" />
          </Link>
        }
      />
      <CardBody className="grid flex-1 grid-cols-2 gap-2.5">
        <Tile label="Total investors" value={investors.total} href="/investors" />
        <Tile
          label="Number of families"
          value={investors.families}
          hint="HUF accounts in the app, plus HUFs onboarded on NSE from this admin."
          href="/onboarding/hufs?view=active"
        />
        <Tile label="ELSS investors" value={investors.elssInvestors} hint="Investors holding an ELSS (tax saver) fund at the last valuation." href="/investors?elss=true" />
        <Tile label="New clients added" value={investors.newThisMonth} caption="This month" href="/investors?joined=month" />
        <div className="col-span-2 rounded-lg bg-surface-sunken px-3 py-2.5">
          <p className="flex items-center gap-1 text-[12px] text-ink-soft">
            Active / Inactive
            <InfoHint text="Active: holds units or has a running SIP. Inactive: everyone else who signed up." />
          </p>
          <p className="tabular mt-1 text-[20px] leading-tight font-semibold text-ink">
            {formatCount(investors.active)} <span className="text-ink-muted">/</span> {formatCount(investors.inactive)}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Split label="Active" value={investors.active} href="/investors?active=true" tone="text-success" />
            <Split label="Inactive" value={investors.inactive} href="/investors?active=false" tone="text-ink-soft" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
