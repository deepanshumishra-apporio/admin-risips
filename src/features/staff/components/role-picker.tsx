'use client';

import { KeyRound, Lock, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useState } from 'react';

import { Toggle } from '@/components/ui/toggle';
import {
  AdminRole,
  LevelRoles,
  RoleManagerRole,
  SubAdminRole,
  levelOf,
  type StaffLevel,
} from '@/features/staff/hierarchy';
import { PermissionLabel } from '@/features/staff/labels';
import type { Role } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

type RolePickerProps = {
  roles: Role[];
  selected: string[];
  disabled?: boolean;
  /** The signed-in admin's level: only an admin may create admins and sub-admins. */
  actorLevel: StaffLevel;
};

const Levels: { level: StaffLevel; title: string; detail: string; icon: typeof ShieldCheck }[] = [
  { level: 'ADMIN', title: 'Admin', detail: 'Full access, including Role Manager', icon: ShieldCheck },
  { level: 'SUB_ADMIN', title: 'Sub-admin', detail: 'Runs the portal and adds operators', icon: UserCog },
  { level: 'OPERATOR', title: 'Operator', detail: 'Only the sections their roles allow', icon: Users },
];

/**
 * Pick a level first, then what goes with it: Role Manager access for a
 * sub-admin, or operator roles. Submits the result as `roleKeys` fields.
 */
export function RolePicker({ roles, selected, disabled = false, actorLevel }: RolePickerProps): React.JSX.Element {
  const [level, setLevel] = useState<StaffLevel>(selected.length ? levelOf(selected) : 'OPERATOR');
  const [roleManager, setRoleManager] = useState(selected.includes(RoleManagerRole));
  const [operatorRoles, setOperatorRoles] = useState<string[]>(selected.filter((key) => !LevelRoles.includes(key)));
  const operatorChoices = roles.filter((role) => !LevelRoles.includes(role.key));
  const adminOnly = actorLevel !== 'ADMIN';

  const roleKeys =
    level === 'ADMIN' ? [AdminRole] : level === 'SUB_ADMIN' ? [SubAdminRole, ...(roleManager ? [RoleManagerRole] : [])] : operatorRoles;

  const toggleOperatorRole = (key: string, on: boolean): void =>
    setOperatorRoles((current) => (on ? [...current, key] : current.filter((entry) => entry !== key)));

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Access level</legend>
      {roleKeys.map((key) => (
        <input key={key} type="hidden" name="roleKeys" value={key} />
      ))}

      <div className="grid gap-2 sm:grid-cols-3">
        {Levels.map((option) => {
          const locked = adminOnly && option.level !== 'OPERATOR';
          const active = level === option.level;
          const Icon = option.icon;
          return (
            <button
              key={option.level}
              type="button"
              disabled={disabled || locked}
              aria-pressed={active}
              onClick={() => setLevel(option.level)}
              title={locked ? 'Only an admin can create admins and sub-admins.' : undefined}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors',
                active ? 'border-brand bg-brand-soft/60' : 'border-line hover:bg-surface-sunken',
                (disabled || locked) && 'cursor-not-allowed opacity-55 hover:bg-transparent',
              )}
            >
              <span className={cn('flex items-center gap-1.5 text-[13.5px] font-semibold', active ? 'text-brand-deep' : 'text-ink')}>
                <Icon className="size-4" />
                {option.title}
                {locked ? <Lock className="size-3 text-ink-muted" /> : null}
              </span>
              <span className="text-[12px] text-ink-muted">{option.detail}</span>
            </button>
          );
        })}
      </div>
      {adminOnly ? <p className="text-[12px] text-ink-muted">Only an admin can create admins and sub-admins.</p> : null}

      {level === 'SUB_ADMIN' ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-3 py-3">
          <span className="flex items-start gap-2.5">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-ink-muted" />
            <span>
              <span className="block text-[13.5px] font-medium text-ink">Role Manager access</span>
              <span className="block text-[12px] text-ink-muted">Lets this sub-admin create and edit operator roles.</span>
            </span>
          </span>
          <Toggle checked={roleManager} onChange={setRoleManager} label="Role Manager access" disabled={disabled || adminOnly} />
        </div>
      ) : null}

      {level === 'OPERATOR' ? (
        <div className="space-y-2">
          {operatorChoices.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No operator roles yet. Create one in Role Manager.</p>
          ) : (
            operatorChoices.map((role) => (
              <label
                key={role.key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50"
              >
                <input
                  type="checkbox"
                  checked={operatorRoles.includes(role.key)}
                  onChange={(event) => toggleOperatorRole(role.key, event.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--color-brand)]"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-ink">{role.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <span key={permission} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink-soft">
                        {PermissionLabel[permission]}
                      </span>
                    ))}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      ) : null}
    </fieldset>
  );
}
