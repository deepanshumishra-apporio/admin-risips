import { redirect } from 'next/navigation';
import { currentSection } from '@/features/hufs/section';

/** Investments live in the HUF's Portfolio and Transactions tabs now; old links land there. */
export default async function HufInvestmentsPage({ params }: { params: Promise<{ id: string }> }): Promise<never> {
  const { id } = await params;
  const section = await currentSection();
  redirect(`${section.base}/${id}?tab=portfolio`);
}
