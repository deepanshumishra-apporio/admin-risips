import { redirect } from 'next/navigation';

/** Investments live in the HUF's Portfolio and Transactions tabs now; old links land there. */
export default async function HufInvestmentsPage({ params }: { params: Promise<{ id: string }> }): Promise<never> {
  const { id } = await params;
  redirect(`/onboarding/hufs/${id}?tab=portfolio`);
}
