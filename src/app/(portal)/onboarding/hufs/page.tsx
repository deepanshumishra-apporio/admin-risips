import { ChevronRight, Landmark, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { NoAccess } from '@/components/ui/no-access';
import { Table, Td } from '@/components/ui/table';
import { HufStatusLabel, HufStatusTone, HufViews, RegistrarLabel, RegistrarTone } from '@/features/hufs/labels';
import { getHufOptions, listHufs } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, timeAgo } from '@/utils/format';

export const metadata: Metadata = { title: 'HUF onboarding · RiSips Admin' };

type HufsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HufsPage({ searchParams }: HufsPageProps): Promise<React.JSX.Element> {
  const description = 'Register Hindu Undivided Families on NSE: the karta consents, a colleague approves, then NSE and the karta take it from there.';
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="HUF onboarding" description={description} />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  const params = await searchParams;
  const viewKey = typeof params['view'] === 'string' ? params['view'] : 'open';
  const view = HufViews.find((v) => v.key === viewKey) ?? HufViews[0]!;
  const [result, options] = await Promise.all([listHufs({ status: view.statuses, limit: 100 }), getHufOptions()]);
  const count = (statuses: readonly string[]): number =>
    statuses.reduce((sum, s) => sum + (result.counts[s as keyof typeof result.counts] ?? 0), 0);

  return (
    <>
      <PageHeader
        title="HUF onboarding"
        description={description}
        actions={
          <Link
            href="/onboarding/hufs/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            New HUF
          </Link>
        }
      />

      {options.nse.environment === 'UAT' ? (
        <p className="mb-4 rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">
          This server sends HUFs to NSE&apos;s <strong>UAT</strong> test environment. Nothing reaches the live NSE account.
        </p>
      ) : null}
      {!options.nse.configured ? (
        <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger">
          NSE is not configured on the admin server yet, so HUFs can be prepared and consented to, but not sent.
        </p>
      ) : null}

      <Card>
        <nav aria-label="HUF views" className="flex flex-wrap gap-2 px-6 pt-5 pb-4">
          {HufViews.map((v) => (
            <Link
              key={v.key}
              href={`/onboarding/hufs?view=${v.key}`}
              aria-current={v.key === view.key ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                v.key === view.key ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
              )}
            >
              {v.label}
              <span className="tabular font-semibold">{formatCount(count(v.statuses))}</span>
            </Link>
          ))}
        </nav>
        {result.items.length === 0 ? (
          <EmptyState
            icon={<Landmark className="size-5" />}
            title="No HUFs here"
            description="Start one with New HUF. It stays a draft until the karta consents."
          />
        ) : (
          <Table headers={['HUF', 'Karta', 'Client code', 'Status', 'NSE bank check', 'FATCA (CAMS / KFin)', 'Updated', '']}>
            {result.items.map((h) => (
              <tr key={h.id} className="group hover:bg-surface-sunken">
                <Td>
                  <Link href={`/onboarding/hufs/${h.id}`} className="font-semibold text-ink group-hover:text-brand">
                    {h.hufName}
                  </Link>
                  <span className="tabular block text-[12px] text-ink-muted">{h.pan}</span>
                </Td>
                <Td>{h.kartaName}</Td>
                <Td className="tabular">{h.clientCode}</Td>
                <Td>
                  <Badge tone={HufStatusTone[h.status]}>{HufStatusLabel[h.status]}</Badge>
                </Td>
                <Td>{h.bankStatus ?? '—'}</Td>
                <Td>
                  {h.fatca ? (
                    <span className="flex gap-1.5">
                      <Badge tone={RegistrarTone[h.fatca.cams]}>{RegistrarLabel[h.fatca.cams]}</Badge>
                      <Badge tone={RegistrarTone[h.fatca.kfin]}>{RegistrarLabel[h.fatca.kfin]}</Badge>
                    </span>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td className="whitespace-nowrap">{timeAgo(h.updatedAt)}</Td>
                <Td>
                  <Link href={`/onboarding/hufs/${h.id}`} aria-label={`Open ${h.hufName}`} className="text-ink-muted group-hover:text-ink">
                    <ChevronRight className="size-4" />
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
