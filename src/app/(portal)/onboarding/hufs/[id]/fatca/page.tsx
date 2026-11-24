import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { HufForm } from '@/features/hufs/components/huf-form';
import { currentSection } from '@/features/hufs/section';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Correct FATCA · RiSips Admin' };

/** A masked date of birth (only the year is shown once on NSE) goes in blank: left blank, the saved date is kept. */
const fullDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');

/**
 * A corrected FATCA declaration for a client already on NSE, e.g. after CAMS or KFin rejected it, or one NSE holds
 * in an old format. Only the FATCA fields change; the karta or signatory consents again and a colleague approves,
 * and then only FATCA_COMMON is sent to NSE.
 */
export default async function CorrectFatcaPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const section = await currentSection();
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Correct FATCA" />
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
  if (!huf.canCorrectFatca) redirect(`${section.base}/${id}`);
  const d = huf.details;
  const initial = {
    ...d,
    karta: { ...d.karta, dateOfBirth: fullDate(d.karta.dateOfBirth) },
    ...(d.owners && { owners: d.owners.map((o) => ({ ...o, dateOfBirth: fullDate(o.dateOfBirth) })) }),
  };
  const company = huf.entityType === 'COMPANY';
  return (
    <>
      <Link href={`${section.base}/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName}
      </Link>
      <PageHeader
        title="Correct the FATCA declaration"
        description={`${huf.clientCode} is already registered on NSE, so only the FATCA details can change here. PANs shown masked are kept as saved unless you type a new one. After saving, the ${company ? 'authorised signatory' : 'karta'} consents on a new link and a colleague approves; then only the FATCA is sent to NSE again.`}
      />
      <HufForm id={id} initial={initial} options={await getHufOptions()} fatcaOnly />
    </>
  );
}
