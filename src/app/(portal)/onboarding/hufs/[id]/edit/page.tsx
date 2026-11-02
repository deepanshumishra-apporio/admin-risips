import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { HufForm } from '@/features/hufs/components/huf-form';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Edit HUF · RiSips Admin' };

export default async function EditHufPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Edit HUF" />
        <NoAccess what="HUF onboarding" />
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
  if (!huf.canEdit) redirect(`/onboarding/hufs/${id}`);
  const consented = huf.consent.state !== 'NONE';
  return (
    <>
      <Link href={`/onboarding/hufs/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName}
      </Link>
      <PageHeader
        title="Edit HUF"
        {...(consented && {
          description: "Saving clears the karta's consent: they agreed to the details as they were, so they need a new link.",
        })}
      />
      <HufForm id={id} initial={huf.details} options={await getHufOptions()} />
    </>
  );
}
