import { PageHeader } from '@/components/layout/page-header';
import { ReviewMeetingsBoard } from '@/features/meetings/components/review-meetings-board';
import { listMeetingConductors, listReviewMeetings } from '@/lib/api/review-meetings';
import { currentStaff } from '@/lib/auth/session';
import type { MeetingStatus } from '@/types/admin-api.types';

const Statuses: readonly MeetingStatus[] = ['SCHEDULED', 'CAPTURED', 'PROFILE_UPDATED'];

/**
 * The review-meetings screen, parked for a later release. Not routed: to
 * enable, render this from `app/(portal)/review-meetings/page.tsx`, restore the
 * nav and landing entries, and mount the backend routes (admin.routes.ts).
 */
export async function ReviewMeetingsScreen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const raw = (await searchParams)['status'];
  const status = Statuses.find((value) => value === (typeof raw === 'string' ? raw.toUpperCase() : '')) ?? null;
  const [meetings, conductors, me] = await Promise.all([
    listReviewMeetings({ ...(status && { status }), limit: 100 }),
    listMeetingConductors(),
    currentStaff(),
  ]);

  return (
    <>
      <PageHeader
        title="Review meetings"
        description="Record each review with an investor and the risk profile it leads to. The record is the evidence behind any change to their curated portfolio."
      />
      <ReviewMeetingsBoard meetings={meetings} status={status} conductors={conductors} meId={me.id} />
    </>
  );
}
