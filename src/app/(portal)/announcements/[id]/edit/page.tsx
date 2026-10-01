import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { AnnouncementComposer } from '@/features/announcements/components/announcement-composer';
import { getAnnouncement } from '@/lib/api/announcements';
import { ApiError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/session';
import type { AnnouncementDetail } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Edit announcement · RiSips Admin' };

type Props = { params: Promise<{ id: string }> };

export default async function EditAnnouncementPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const back = (
    <Link href={`/announcements/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Back to the announcement
    </Link>
  );
  if (!(await hasPermission('announcements.manage'))) {
    return (
      <>
        {back}
        <PageHeader title="Edit announcement" />
        <NoAccess what="announcements" />
      </>
    );
  }
  let item: AnnouncementDetail;
  try {
    item = await getAnnouncement(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  // Only the author's draft (or rejected one) is editable; anything else goes back to its page.
  if (!item.can.edit) redirect(`/announcements/${id}`);

  return (
    <>
      {back}
      <PageHeader title={`Edit: ${item.name}`} description={item.status === 'REJECTED' ? 'Saving takes it back to draft; send it for approval again.' : undefined} />
      <AnnouncementComposer
        existing={{
          id,
          input: {
            name: item.name, category: item.category, audience: item.audience, title: item.title, body: item.body,
            sendNotification: item.sendNotification, showBanner: item.showBanner, tag: item.tag, bannerTitle: item.bannerTitle,
            bannerBody: item.bannerBody, highlight: item.highlight, ctaLabel: item.ctaLabel, ctaAction: item.ctaAction,
            startsAt: item.startsAt, endsAt: item.endsAt,
          },
        }}
      />
    </>
  );
}
