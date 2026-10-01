import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { AnnouncementComposer } from '@/features/announcements/components/announcement-composer';
import { hasPermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'New announcement · RiSips Admin' };

export default async function NewAnnouncementPage(): Promise<React.JSX.Element> {
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
        <PageHeader title="New announcement" />
        <NoAccess what="announcements" />
      </>
    );
  }
  return (
    <>
      {back}
      <PageHeader title="New announcement" description="Saved as a draft. Send it for approval when it is ready; a colleague approves it before it goes out." />
      <AnnouncementComposer />
    </>
  );
}
