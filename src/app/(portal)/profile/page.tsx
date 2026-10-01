import { PageHeader } from '@/components/layout/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { SectionTabs } from '@/components/ui/section-tabs';
import { CurrentAdmin } from '@/data/profile';
import { NotificationPreferences } from '@/features/profile/components/notification-preferences';
import { PersonalDetails } from '@/features/profile/components/personal-details';
import { RoleCard } from '@/features/profile/components/role-card';
import { SecuritySettings } from '@/features/profile/components/security-settings';
import { WorkspacePreferences } from '@/features/profile/components/workspace-preferences';
import { formatDate } from '@/utils/format';

export default function ProfilePage(): React.JSX.Element {
  return (
    <>
      <PageHeader
        title="Your profile"
        description="Your details and every setting that applies to your account. Role and permissions are set elsewhere."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <SectionTabs
          tabs={[
            { label: 'Profile', content: <PersonalDetails /> },
            { label: 'Notifications', content: <NotificationPreferences /> },
            { label: 'Workspace', content: <WorkspacePreferences /> },
            { label: 'Security', content: <SecuritySettings /> },
          ]}
        />

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={CurrentAdmin.name} className="size-11 text-[15px]" />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{CurrentAdmin.name}</p>
                  <p className="truncate text-[12.5px] text-ink-muted">{CurrentAdmin.email}</p>
                </div>
              </div>

              <dl className="space-y-2.5 border-t border-line pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12.5px] text-ink-muted">Role</dt>
                  <dd>
                    <Badge tone="brand">{CurrentAdmin.role}</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12.5px] text-ink-muted">Member since</dt>
                  <dd className="tabular text-[13px] text-ink">{formatDate(CurrentAdmin.memberSince)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12.5px] text-ink-muted">Last active</dt>
                  <dd className="tabular text-[13px] text-ink">{formatDate(CurrentAdmin.lastActiveAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12.5px] text-ink-muted">Timezone</dt>
                  <dd className="text-[13px] text-ink">{CurrentAdmin.timezone}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <RoleCard profile={CurrentAdmin} />
        </div>
      </div>
    </>
  );
}
