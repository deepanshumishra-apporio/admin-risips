import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { HufForm } from '@/features/hufs/components/huf-form';
import { currentSection } from '@/features/hufs/section';
import { getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'New · RiSips Admin' };

/** New HUF (/onboarding/hufs/new) or new company (/onboarding/companies/new), by the section it was opened in. */
export default async function NewHufPage(): Promise<React.JSX.Element> {
  const section = await currentSection();
  const company = section.type === 'COMPANY';
  const back = (
    <Link href={section.base} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      {section.title}
    </Link>
  );
  const header = (
    <PageHeader
      title={company ? 'New company' : 'New HUF'}
      description={`Saved as a draft. Nothing goes to NSE until the ${company ? 'authorised signatory' : 'karta'} has consented and a colleague approves.`}
    />
  );
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        {back}
        {header}
        <NoAccess what={section.title} />
      </>
    );
  }
  return (
    <>
      {back}
      {header}
      <HufForm initial={null} entityType={company ? 'COMPANY' : 'HUF'} options={await getHufOptions()} />
    </>
  );
}
