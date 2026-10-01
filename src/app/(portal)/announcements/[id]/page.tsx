import { ArrowLeft, Gift } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StatStrip } from '@/components/ui/stat-strip';
import { AnnouncementWorkflow } from '@/features/announcements/components/announcement-workflow';
import { AudienceLabel, CategoryLabel, CtaActionLabel, StatusLabel, StatusTone } from '@/features/announcements/labels';
import { PhonePreview } from '@/features/notifications/components/phone-preview';
import { getAnnouncement } from '@/lib/api/announcements';
import { ApiError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/session';
import type { AnnouncementDetail } from '@/types/admin-api.types';
import { formatCount, formatDateTime, formatPercent } from '@/utils/format';

export const metadata: Metadata = { title: 'Announcement · RiSips Admin' };

type Props = { params: Promise<{ id: string }> };

function Fact({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

const share = (part: number, whole: number): string => (whole > 0 ? formatPercent((part / whole) * 100, 0) : '—');

export default async function AnnouncementPage({ params }: Props): Promise<React.JSX.Element> {
  const back = (
    <Link href="/announcements" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Announcements
    </Link>
  );
  if (!(await hasPermission('announcements.manage'))) {
    return (
      <>
        {back}
        <PageHeader title="Announcement" />
        <NoAccess what="announcements" />
      </>
    );
  }
  const { id } = await params;
  let item: AnnouncementDetail;
  try {
    item = await getAnnouncement(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const { stats } = item;
  const sample = (text: string) => text.replaceAll('{{firstName}}', 'Asha');

  return (
    <>
      {back}
      <PageHeader
        title={item.name}
        description={`${CategoryLabel[item.category]} · ${AudienceLabel[item.audience]} · starts ${formatDateTime(item.startsAt)}${item.endsAt ? ` · ends ${formatDateTime(item.endsAt)}` : ''}`}
        actions={
          <Badge tone={StatusTone[item.status]} dot={item.status === 'LIVE'}>
            {StatusLabel[item.status]}
          </Badge>
        }
      />

      {item.sentAt ? (
        <StatStrip
          className="mb-5"
          items={[
            { label: 'In the audience', value: formatCount(stats.targeted), caption: `sent ${formatDateTime(item.sentAt)}` },
            { label: 'Delivered', value: formatCount(stats.delivered), caption: `${formatCount(stats.optedOut)} opted out · ${formatCount(stats.capped)} over the weekly cap` },
            { label: 'Opened', value: formatCount(stats.read), caption: `${share(stats.read, stats.delivered)} of delivered` },
            ...(item.showBanner
              ? [
                  { label: 'Saw the pop-up', value: formatCount(stats.bannerSeen) },
                  { label: 'Tapped the button', value: formatCount(stats.bannerClicked), caption: `${share(stats.bannerClicked, stats.bannerSeen)} of those who saw it` },
                ]
              : []),
          ]}
        />
      ) : null}

      {item.rejectionReason && item.status === 'REJECTED' ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
          Rejected: {item.rejectionReason}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Message" />
            <CardBody className="space-y-2">
              <p className="text-[15px] font-semibold text-ink">{item.title}</p>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink-soft">{item.body}</p>
            </CardBody>
          </Card>

          {item.showBanner ? (
            <Card>
              <CardHeader title="Home banner and pop-up" />
              <CardBody className="space-y-4">
                <div className="flex max-w-md items-center gap-3 rounded-2xl border border-[#F2B84B]/30 bg-[linear-gradient(90deg,rgba(242,184,75,0.22),#161E2D)] p-4 text-white">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F2B84B]/15">
                    <Gift className="size-5 text-[#F2B84B]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold">{item.bannerTitle}</span>
                    <span className="block truncate text-[12.5px] text-white/70">{item.bannerBody}</span>
                  </span>
                </div>
                <dl className="max-w-md">
                  <Fact label="Tag">{item.tag}</Fact>
                  {item.highlight ? <Fact label="Highlight">{item.highlight}</Fact> : null}
                  <Fact label="Button">{item.ctaAction && item.ctaAction !== 'none' ? `${item.ctaLabel ?? CtaActionLabel[item.ctaAction]} → ${CtaActionLabel[item.ctaAction]}` : 'None'}</Fact>
                </dl>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Approval" />
            <CardBody>
              <dl>
                <Fact label="Composed by">{item.createdBy?.name ?? '—'}</Fact>
                <Fact label="Sent for approval">{item.submittedAt ? formatDateTime(item.submittedAt) : '—'}</Fact>
                <Fact label="Approved by">{item.approvedBy ? `${item.approvedBy.name}, ${item.approvedAt ? formatDateTime(item.approvedAt) : ''}` : '—'}</Fact>
                {item.cancelledAt ? <Fact label="Cancelled">{formatDateTime(item.cancelledAt)}</Fact> : null}
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Next step" />
            <CardBody>
              <AnnouncementWorkflow announcement={item} />
            </CardBody>
          </Card>
          {item.sendNotification ? <PhonePreview title={sample(item.title)} body={sample(item.body)} deepLink="the Notifications screen" /> : null}
        </div>
      </div>
    </>
  );
}
