import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { HufForm } from '@/features/hufs/components/huf-form';
import { getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'New HUF · RiSips Admin' };

export default async function NewHufPage(): Promise<React.JSX.Element> {
  const back = (
    <Link href="/onboarding/hufs" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      HUF onboarding
    </Link>
  );
  const header = (
    <PageHeader title="New HUF" description="Saved as a draft. Nothing goes to NSE until the karta has consented and a colleague approves." />
  );
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        {back}
        {header}
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  return (
    <>
      {back}
      {header}
      <HufForm initial={null} options={await getHufOptions()} />
    </>
  );
}
