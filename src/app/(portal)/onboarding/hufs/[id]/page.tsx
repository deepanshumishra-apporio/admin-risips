import { ArrowLeft, ExternalLink, Pencil, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { SectionTabs } from '@/components/ui/section-tabs';
import {
  ApproveAction, CancelAction, ConsentLinkAction, MarkActiveAction, RefreshAction, ResendAction,
} from '@/features/hufs/components/huf-actions';
import {
  AtAGlance, FamilyPanel, HistoryPanel, OnboardingPanel, PortfolioPanel, TransactionsPanel,
} from '@/features/hufs/components/huf-record';
import { HufStatusLabel, HufStatusTone } from '@/features/hufs/labels';
import { fundsOf } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView } from '@/types/admin-api.types';
import { currentSection, sectionFor } from '@/features/hufs/section';

export const metadata: Metadata = { title: 'HUF or company · RiSips Admin' };

/** The tabs, by the name a link can open them with (?tab=portfolio). */
const TabKeys = ['onboarding', 'portfolio', 'transactions', 'family', 'history'] as const;

type HufPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * One HUF: where it stands on NSE, what it holds and has ordered, the family behind it, and its history.
 * The next thing to do sits beside every tab.
 */
export default async function HufPage({ params, searchParams }: HufPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const section = await currentSection();
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title={section.title} />
        <NoAccess what={section.title} />
      </>
    );
  }
  let huf: HufDetail;
  try {
    huf = await getHuf(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  // A company opened from HUF onboarding (or the other way round, e.g. an old link) moves to its own section.
  const own = sectionFor(huf.entityType);
  if (own.base !== section.base) redirect(`${own.base}/${id}`);
  const onNse = Boolean(huf.steps.ucc?.ok) && huf.status !== 'CANCELLED';
  const [options, view] = await Promise.all([getHufOptions(), onNse ? getHufInvestments(id) : Promise.resolve<HufInvestmentsView | null>(null)]);
  const live = options.nse.environment === 'LIVE';
  const { steps } = huf;
  const inv = view?.investments ?? null;

  const asked = (await searchParams)['tab'];
  const askedIndex = TabKeys.indexOf((typeof asked === 'string' ? asked : '') as never);
  // A HUF already on NSE opens on its money; one still being onboarded, on its steps.
  const initial = askedIndex >= 0 ? askedIndex : onNse && huf.status === 'ACTIVE' ? 1 : 0;

  const tabs = [
    { label: 'Onboarding', ...(huf.problems.length ? { count: huf.problems.length } : {}), content: <OnboardingPanel huf={huf} options={options} /> },
    ...(view
      ? [
          { label: 'Portfolio', ...(inv && fundsOf(inv).length ? { count: fundsOf(inv).length } : {}), content: <PortfolioPanel hufId={id} view={view} base={section.base} /> },
          { label: 'Transactions', ...(inv?.orders.length ? { count: inv.orders.length } : {}), content: <TransactionsPanel hufId={id} view={view} base={section.base} /> },
        ]
      : []),
    { label: huf.entityType === 'COMPANY' ? 'Company & bank' : 'Family & bank', content: <FamilyPanel huf={huf} /> },
    { label: 'History', content: <HistoryPanel huf={huf} /> },
  ];
  // Without Portfolio and Transactions the keys shift; map the asked tab onto what is shown.
  const shown = view ? TabKeys : (['onboarding', 'family', 'history'] as const);
  const initialShown = Math.max(0, (shown as readonly string[]).indexOf(TabKeys[initial] ?? 'onboarding'));

  return (
    <>
      <Link href={section.base} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {section.title}
      </Link>
      <PageHeader
        title={huf.hufName}
        description={`${huf.entityType === 'COMPANY' ? 'Company · signatory' : 'Karta'} ${huf.kartaName || 'not on NSE’s record'} · client code ${huf.clientCode} · ${live ? 'NSE live' : 'NSE UAT'}`}
        actions={
          <>
            <Badge tone={HufStatusTone[huf.status]} dot>
              {HufStatusLabel[huf.status]}
            </Badge>
            {huf.source === 'NSE' ? <Badge tone="neutral">On NSE directly</Badge> : null}
            {huf.canEdit ? (
              <Link
                href={`${section.base}/${id}/edit`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
            {view && !view.block ? (
              <Link
                href={`${section.base}/${id}/invest`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-strong"
              >
                <Plus className="size-3.5" />
                Invest
              </Link>
            ) : null}
          </>
        }
      />

      {huf.problems.length ? (
        <div role="alert" className="mb-4 space-y-1 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          {huf.problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}

      {/* grid-cols-1 is minmax(0,1fr): without it the column grows to the tables' min width and the page scrolls sideways. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionTabs tabs={tabs} initial={initialShown} />

        <div className="space-y-4">
          <AtAGlance huf={huf} view={view} />
          <Card>
            <CardHeader title="Next" />
            <CardBody className="space-y-4">
              {huf.canRequestConsent ? <ConsentLinkAction id={id} again={huf.consent.state !== 'NONE'} /> : null}
              {huf.status === 'CONSENTED' || huf.status === 'NSE_FAILED' ? (
                huf.approval ? (
                  <p className="text-[13px] text-ink-soft">{huf.approval}</p>
                ) : (
                  <ApproveAction id={id} duplicateCodes={(steps.duplicateCheck?.codes ?? []).filter((c) => c !== huf.clientCode)} live={live} />
                )
              ) : null}
              {onNse ? <RefreshAction id={id} /> : null}
              {huf.authLink && huf.status !== 'ACTIVE' ? (
                <a href={huf.authLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-deep">
                  {huf.entityType === 'COMPANY' ? 'NSE authorisation link' : <>The karta&apos;s NSE authorisation link</>}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : huf.authLinkError && huf.status === 'AWAITING_KARTA' && huf.source !== 'NSE' ? (
                <p className="text-[12.5px] text-ink-muted">NSE link not issued yet: {huf.authLinkError}</p>
              ) : null}
              {steps.fatca?.ok && huf.status !== 'ACTIVE' && huf.source !== 'NSE' ? <ResendAction id={id} /> : null}
              {huf.status === 'AWAITING_KARTA' ? <MarkActiveAction id={id} /> : null}
              {huf.status === 'ACTIVE' ? <p className="text-[13px] text-success">Active on NSE. The {huf.entityType === 'COMPANY' ? 'company' : 'HUF'} invests from its own bank account.</p> : null}
              {huf.canCancel ? <CancelAction id={id} /> : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
