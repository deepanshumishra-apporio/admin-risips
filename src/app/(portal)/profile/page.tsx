import { KeyRound, LogOut } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { signOut } from '@/features/auth/actions';
import { TwoFactorCard } from '@/features/auth/components/two-factor-card';
import { PermissionGroups, PermissionLabel } from '@/features/staff/labels';
import { currentStaff } from '@/lib/auth/session';
import { formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Your profile · RiSips Admin' };

/**
 * The signed-in staff member, from the admin backend (`/me`). It used to show a hard-coded sample person with fake
 * sessions and settings that saved nothing; only what is real is shown now. Names, roles and access are changed by an
 * administrator in Roles & access.
 */
export default async function ProfilePage(): Promise<React.JSX.Element> {
  const me = await currentStaff();
  const has = new Set(me.permissions);
  const groups = PermissionGroups.map((g) => ({ title: g.title, permissions: g.permissions.filter((p) => has.has(p)) })).filter((g) => g.permissions.length);

  return (
    <>
      <PageHeader title="Your profile" description="Your account as the admin knows it. An administrator changes your name, roles and access in Roles & access." />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="What you can do" subtitle="Your access comes from your roles." />
            <CardBody className="space-y-4">
              {groups.length ? (
                groups.map((g) => (
                  <div key={g.title}>
                    <p className="text-[12.5px] font-medium text-ink-muted">{g.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.permissions.map((p) => (
                        <Badge key={p} tone="neutral">{PermissionLabel[p]}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-ink-muted">You have no access yet. Ask an administrator.</p>
              )}
            </CardBody>
          </Card>

          <TwoFactorCard mfa={me.mfa} />

          <Card>
            <CardHeader title="Security" subtitle="Changing your password signs you out everywhere else." />
            <CardBody className="flex flex-wrap gap-3">
              <Link
                href="/signin/password"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-surface-sunken"
              >
                <KeyRound className="size-4" />
                Change password
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={me.fullName} className="size-11 text-[15px]" />
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-semibold text-ink">{me.fullName}</p>
                <p className="truncate text-[12.5px] text-ink-muted">{me.email}</p>
              </div>
            </div>
            <dl className="space-y-2.5 border-t border-line pt-3.5">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[12.5px] text-ink-muted">{me.roles.length === 1 ? 'Role' : 'Roles'}</dt>
                <dd className="flex flex-wrap justify-end gap-1.5">
                  {me.roles.length ? me.roles.map((r) => <Badge key={r.key} tone="brand">{r.name}</Badge>) : <span className="text-[13px] text-ink-muted">None</span>}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[12.5px] text-ink-muted">Last sign-in</dt>
                <dd className="tabular text-[13px] text-ink">{me.lastLoginAt ? formatDateTime(me.lastLoginAt) : '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
