import { ArrowLeft, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { NewTicketForm } from '@/features/support/components/new-ticket-form';
import { listInvestors } from '@/lib/api/admin';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';

export const metadata: Metadata = { title: 'New ticket · RiSips Admin' };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NewTicketPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '').trim();

/** Pick the investor, then describe the request. The investor comes from the list search, never from free text. */
export default async function NewTicketPage({ searchParams }: NewTicketPageProps): Promise<React.JSX.Element> {
  const back = (
    <Link href="/support" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Support tickets
    </Link>
  );
  const header = <PageHeader title="New ticket" description="Log a request that came in by phone or email, so it is tracked to resolution like any other." />;
  const [canManage, canSearch] = await Promise.all([hasPermission('support.manage'), hasPermission('investors.read')]);
  if (!canManage || !canSearch) {
    return (
      <>
        {back}
        {header}
        <NoAccess what={canManage ? 'investor records, which you need to pick the investor' : 'support tickets'} />
      </>
    );
  }

  const params = await searchParams;
  const q = first(params['q']).slice(0, 100);
  const investorId = first(params['investor']);
  const chosen = Uuid.test(investorId) ? investorId : null;
  const results = q ? await listInvestors({ search: q, limit: 10 }) : null;
  const chosenName = first(params['name']).slice(0, 150);

  return (
    <>
      {back}
      {header}
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader title="1. Investor" subtitle={chosen ? `Raising for ${chosenName || 'the selected investor'}` : 'Search by name, phone, email or PAN'} />
          <CardBody>
            <form method="get" action="/support/new" className="flex gap-2">
              <span className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                <input
                  name="q"
                  defaultValue={q}
                  maxLength={100}
                  placeholder="e.g. Asha, 98765, 234F"
                  className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
                />
              </span>
              <button type="submit" className="h-9 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken">
                Search
              </button>
            </form>
            {results ? (
              results.items.length === 0 ? (
                <p className="mt-3 text-[13px] text-ink-muted">No investor matches “{q}”.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                  {results.items.map((investor) => {
                    const name = investor.name ?? 'Unnamed investor';
                    const href = `/support/new?${new URLSearchParams({ q, investor: investor.id, name }).toString()}`;
                    return (
                      <li key={investor.id}>
                        <Link
                          href={href}
                          className={cn(
                            'flex items-center justify-between gap-3 px-3 py-2 text-[13px] transition-colors hover:bg-surface-sunken',
                            chosen === investor.id && 'bg-brand-soft',
                          )}
                        >
                          <span className="font-medium text-ink">{name}</span>
                          <span className="tabular text-[12px] text-ink-muted">
                            {investor.phone}
                            {investor.pan ? ` · ${investor.pan}` : ''}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : null}
          </CardBody>
        </Card>

        {chosen ? (
          <Card>
            <CardHeader title="2. The request" />
            <CardBody>
              <NewTicketForm userId={chosen} />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
