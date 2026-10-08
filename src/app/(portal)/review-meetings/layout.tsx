import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { hasPermission } from '@/lib/auth/session';

/** Every page under this section needs `meetings.manage`. */
export default async function ReviewMeetingsLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  if (!(await hasPermission('meetings.manage'))) {
    return (
      <>
        <PageHeader title="Review meetings" />
        <NoAccess what="review meetings" />
      </>
    );
  }
  return <>{children}</>;
}
