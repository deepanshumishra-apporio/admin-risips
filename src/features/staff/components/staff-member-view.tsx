import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { AccessForm, ProfileForm } from '@/features/staff/components/edit-staff-form';
import { DangerCommands, SecurityCommands } from '@/features/staff/components/staff-commands';
import { LevelLabel, RoleManagerRole, canManage, levelOf, myLevel, type StaffLevel } from '@/features/staff/hierarchy';
import { LoginOutcomeLabel, PermissionGroups, PermissionLabel, StaffStatusLabel, StaffStatusTone } from '@/features/staff/labels';
import type { Permission, Role, StaffDetail, StaffMe } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime, timeAgo } from '@/utils/format';

const LevelTone: Record<StaffLevel, 'violet' | 'brand' | 'neutral'> = { ADMIN: 'violet', SUB_ADMIN: 'brand', OPERATOR: 'neutral' };

function Fact({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string; sub?: string; tone?: 'success' | 'warn' }): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          tone === 'success' ? 'bg-success-soft text-success' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-surface-sunken text-ink-muted',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11.5px] text-ink-muted">{label}</span>
        <span className="block truncate text-[14px] font-semibold text-ink">{value}</span>
        {sub ? <span className="block truncate text-[11.5px] text-ink-muted">{sub}</span> : null}
      </span>
    </div>
  );
}

/** What this person can open, from every role they hold. */
function EffectiveAccess({ staff, roles }: { staff: StaffDetail; roles: Role[] }): React.JSX.Element {
  const held = new Set(staff.roles.map((role) => role.key));
  const granted = new Set<Permission>(roles.filter((role) => held.has(role.key)).flatMap((role) => role.permissions));
  const all = PermissionGroups.flatMap((group) => group.permissions);
  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between text-[12px] text-ink-muted">
        <span className="font-semibold tracking-[0.04em] uppercase">Can open</span>
        <span className="tabular">
          {all.filter((key) => granted.has(key)).length} of {all.length}
        </span>
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {all.map((key) => {
          const on = granted.has(key);
          return (
            <li
              key={key}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px]',
                on ? 'bg-success-soft/60 font-medium text-ink' : 'bg-surface-sunken/70 text-ink-muted',
              )}
            >
              {on ? <Check className="size-3.5 text-success" /> : <Lock className="size-3 text-ink-muted/70" />}
              {PermissionLabel[key]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SignInActivity({ logins }: { logins: StaffDetail['recentLogins'] }): React.JSX.Element {
  if (logins.length === 0) return <p className="py-6 text-center text-[13px] text-ink-muted">No sign-in attempts yet.</p>;
  return (
    <ol className="relative space-y-3.5 border-l border-line pl-5">
      {logins.map((login) => {
        const ok = login.outcome.endsWith('SUCCESS');
        return (
          <li key={`${login.at}-${login.outcome}`} className="relative">
            <span className="absolute top-0.5 -left-[29px] flex size-4 items-center justify-center rounded-full bg-surface">
              {ok ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-danger" />}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className={cn('text-[13px] font-medium', ok ? 'text-ink' : 'text-danger')}>{LoginOutcomeLabel[login.outcome] ?? login.outcome}</span>
              <span className="text-[12px] text-ink-muted" title={formatDateTime(login.at)}>
                {timeAgo(login.at)}
              </span>
            </div>
            {login.ipAddress ? <span className="tabular block text-[11.5px] text-ink-muted">{login.ipAddress}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** One staff member's page. Data in, markup out — the route fetches. */
export function StaffMemberView({ staff, roles, me }: { staff: StaffDetail; roles: Role[]; me: Pick<StaffMe, 'id' | 'roles'> }): React.JSX.Element {
  const isSelf = me.id === staff.id;
  const actorLevel = myLevel(me);
  const level = levelOf(staff.roles.map((role) => role.key));
  const manageable = canManage(actorLevel, level);
  const deactivated = staff.status === 'DEACTIVATED';
  const failed = staff.recentLogins.filter((login) => !login.outcome.endsWith('SUCCESS')).length;

  const accessLock = deactivated
    ? 'A deactivated account keeps its access record as it was.'
    : isSelf
      ? 'Another admin has to change your access.'
      : !manageable
        ? 'Only an admin can change an admin or sub-admin.'
        : null;

  const alerts = [
    ...(staff.locked ? [{ tone: 'danger' as const, text: 'Locked out after too many wrong passwords. Resetting the password unlocks them.' }] : []),
    ...(!staff.mfaEnrolled && !deactivated ? [{ tone: 'warn' as const, text: 'Two-factor sign-in isn’t set up yet. They’ll be asked to at their next sign-in.' }] : []),
    ...(staff.mustChangePassword && !deactivated ? [{ tone: 'warn' as const, text: 'Still on a temporary password; they must change it when they sign in.' }] : []),
  ];

  return (
    <>
      {/* Identity and the four things people ask about first. */}
      <Card className="mb-4">
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={staff.fullName} tone={level === 'ADMIN' ? 'violet' : 'brand'} className="size-14 text-[18px]" />
            <div className="min-w-[180px] flex-1">
              <h1 className="truncate text-[20px] leading-tight font-semibold tracking-[-0.015em] text-ink">{staff.fullName}</h1>
              <p className="truncate text-[13px] text-ink-muted">{staff.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={LevelTone[level]}>{LevelLabel[level]}</Badge>
              {staff.roles.some((role) => role.key === RoleManagerRole) ? (
                <Badge tone="brand" className="gap-1">
                  <KeyRound className="size-3" /> Role Manager
                </Badge>
              ) : null}
              <Badge tone={StaffStatusTone[staff.status]} dot>
                {StaffStatusLabel[staff.status]}
              </Badge>
              {isSelf ? <Badge tone="success">You</Badge> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4 lg:grid-cols-4">
            <Fact
              icon={Clock}
              label="Last sign-in"
              value={staff.lastLoginAt ? timeAgo(staff.lastLoginAt) : 'Never'}
              {...(staff.lastLoginAt && { sub: formatDateTime(staff.lastLoginAt) })}
            />
            <Fact icon={MonitorSmartphone} label="Active sessions" value={String(staff.activeSessions)} sub={staff.activeSessions ? 'signed in now' : 'signed out'} />
            <Fact
              icon={staff.mfaEnrolled ? ShieldCheck : ShieldAlert}
              label="Two-factor"
              value={staff.mfaEnrolled ? 'On' : 'Not set up'}
              tone={staff.mfaEnrolled ? 'success' : 'warn'}
            />
            <Fact
              icon={UserPlus}
              label="Added"
              value={formatDate(staff.createdAt)}
              {...(staff.createdBy && { sub: `by ${staff.createdBy.fullName}` })}
            />
          </div>
        </CardBody>
      </Card>

      {alerts.length ? (
        <ul className="mb-4 space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.text}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px]',
                alert.tone === 'danger' ? 'border-danger/25 bg-danger-soft text-danger' : 'border-warn/25 bg-warn-soft text-ink-soft',
              )}
            >
              <AlertTriangle className={cn('size-4 shrink-0', alert.tone === 'danger' ? 'text-danger' : 'text-warn')} />
              {alert.text}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Profile" />
            <CardBody>
              <ProfileForm staff={staff} editable={!deactivated && (isSelf || manageable)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Access" subtitle="Changes apply on their next click" />
            <CardBody className="space-y-5">
              <AccessForm staff={staff} roles={roles} actorLevel={actorLevel} editable={accessLock === null} lockedReason={accessLock} />
              <div className="border-t border-line pt-4">
                <EffectiveAccess staff={staff} roles={roles} />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Security" />
            <CardBody>
              {deactivated ? (
                <p className="text-[13px] text-ink-muted">Deactivated {staff.deactivatedAt ? formatDate(staff.deactivatedAt) : ''}. Kept for the audit trail.</p>
              ) : isSelf ? (
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  For your own account, use{' '}
                  <Link href="/signin/password" className="font-medium text-brand hover:text-brand-deep">
                    Change password
                  </Link>
                  . Anything else, ask another admin.
                </p>
              ) : manageable ? (
                <SecurityCommands staff={staff} />
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <Lock className="size-3.5" /> Only an admin can reset an admin or sub-admin.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Sign-in activity"
              action={
                staff.recentLogins.length ? (
                  <span className="tabular text-[12px] text-ink-muted">
                    {failed ? <span className="font-medium text-danger">{failed} failed</span> : 'all succeeded'} · last {staff.recentLogins.length}
                  </span>
                ) : null
              }
            />
            <CardBody>
              <SignInActivity logins={staff.recentLogins} />
            </CardBody>
          </Card>

          {!deactivated && !isSelf && manageable ? (
            <Card className="border-danger/25">
              <CardHeader title="Danger zone" />
              <CardBody>
                <DangerCommands staff={staff} />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
