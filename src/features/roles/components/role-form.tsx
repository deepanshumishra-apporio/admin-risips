'use client';

import { CheckCircle2, Lock } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, TextInput } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import { FormError } from '@/features/auth/components/form-parts';
import { createRole, updateRole, type RoleFormState } from '@/features/roles/actions';
import { AdminRole, LevelPermissions, RoleManagerRole, SubAdminRole } from '@/features/staff/hierarchy';
import { PermissionGroups, PermissionLabel } from '@/features/staff/labels';
import type { Permission, PermissionInfo, Role } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: RoleFormState = { error: null };

type RoleFormProps = {
  /** Absent when creating. */
  role?: Role;
  catalogue: PermissionInfo[];
  /** What the signed-in admin holds; nobody can hand out access they don't have. */
  mine: Permission[];
  /** Shown, every switch fixed — e.g. a role you hold yourself. */
  readOnlyReason?: string;
};

/** Why a switch can't move for this role, or null if it can. Mirrors the API's rules. */
function lockReason(roleKey: string | undefined, key: Permission, mine: Permission[]): string | null {
  if (roleKey === AdminRole) return 'Admins always have every permission.';
  if (roleKey === RoleManagerRole) return 'Role Manager access is switched on each sub-admin.';
  if (roleKey === SubAdminRole && key === 'staff.manage') return 'Sub-admins always manage operators.';
  if (roleKey === SubAdminRole && key === 'roles.manage') return "Given per sub-admin, from their staff page.";
  if (roleKey !== SubAdminRole && LevelPermissions.includes(key)) return 'Only admins and sub-admins can have this.';
  if (!mine.includes(key)) return "You don't have this access yourself.";
  return null;
}

function SaveButton({ label, disabled }: { label: string; disabled: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

const sameSet = (a: Set<Permission>, b: Set<Permission>): boolean => a.size === b.size && [...a].every((key) => b.has(key));

export function RoleForm({ role, catalogue, mine, readOnlyReason }: RoleFormProps): React.JSX.Element {
  const [state, action] = useActionState(role ? updateRole : createRole, Initial);
  const [baseline, setBaseline] = useState<Set<Permission>>(new Set(role?.permissions ?? []));
  const [selected, setSelected] = useState<Set<Permission>>(new Set(role?.permissions ?? []));
  const [showSaved, setShowSaved] = useState(false);
  const builtIn = role?.isSystem ?? false;

  // A save makes the current switches the new baseline, so the bar settles.
  useEffect(() => {
    if (!state.saved) return;
    setBaseline(new Set(selected));
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a new save result
  }, [state]);

  // Every operation is listed for every role: on or off, and locked where the hierarchy fixes it.
  const known = new Set(catalogue.map((entry) => entry.key));
  const describe = (key: Permission): string | undefined => catalogue.find((entry) => entry.key === key)?.description;
  const locked = (key: Permission): string | null => readOnlyReason ?? lockReason(role?.key, key, mine);
  const editable = (key: Permission): boolean => locked(key) === null;
  const anySwitchable = [...known].some(editable);
  const changes = [...known].filter((key) => selected.has(key) !== baseline.has(key)).length;
  const dirty = role ? !sameSet(selected, baseline) : true;

  const toggle = (key: Permission, on: boolean): void => {
    setShowSaved(false);
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-6">
      {role ? <input type="hidden" name="key" value={role.key} /> : null}
      <input type="hidden" name="system" value={String(builtIn)} />
      {[...selected].map((key) => (
        <input key={key} type="hidden" name="permissions" value={key} />
      ))}

      <FormError message={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role name" required={!builtIn} {...(builtIn && { hint: 'Built-in roles keep their name.' })}>
          <TextInput
            name="name"
            defaultValue={role?.name ?? ''}
            required={!builtIn}
            readOnly={builtIn}
            maxLength={80}
            placeholder="e.g. Branch manager"
            className={cn(builtIn && 'bg-surface-sunken text-ink-muted')}
          />
        </Field>
        <Field label="Description">
          <TextInput
            name="description"
            defaultValue={role?.description ?? ''}
            readOnly={builtIn}
            maxLength={200}
            placeholder="Optional"
            className={cn(builtIn && 'bg-surface-sunken text-ink-muted')}
          />
        </Field>
      </div>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-ink-soft">Permissions</p>
          <p className="tabular text-[12px] text-ink-muted">
            {[...selected].filter((key) => known.has(key)).length} of {known.size} on
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {PermissionGroups.map((group) => {
            const keys = group.permissions.filter((key) => known.has(key));
            if (keys.length === 0) return null;
            const switchable = keys.filter(editable);
            const allOn = switchable.length > 0 && switchable.every((key) => selected.has(key));

            return (
              <section key={group.title} className="rounded-lg border border-line">
                <div className="flex items-center justify-between border-b border-line bg-surface-sunken/60 px-3.5 py-2">
                  <h3 className="text-[12px] font-semibold tracking-[0.04em] text-ink-muted uppercase">{group.title}</h3>
                  {switchable.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => switchable.forEach((key) => toggle(key, !allOn))}
                      className="text-[12px] font-medium text-brand hover:text-brand-deep"
                    >
                      {allOn ? 'Turn all off' : 'Turn all on'}
                    </button>
                  ) : null}
                </div>
                <ul className="divide-y divide-line">
                  {keys.map((key) => {
                    const canEdit = editable(key);
                    const on = selected.has(key);
                    const changed = role !== undefined && on !== baseline.has(key);
                    return (
                      <li
                        key={key}
                        className={cn('flex items-center gap-3 px-3.5 py-3 transition-colors', changed && 'bg-brand-soft/40')}
                        title={locked(key) ?? undefined}
                      >
                        <span className={cn('min-w-0 flex-1', !canEdit && 'opacity-60')}>
                          <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
                            {PermissionLabel[key]}
                            {canEdit ? null : <Lock className="size-3 text-ink-muted" />}
                            {changed ? <span className="size-1.5 rounded-full bg-brand" aria-label="Changed" /> : null}
                          </span>
                          {describe(key) ? <span className="block text-[12px] text-ink-muted">{describe(key)}</span> : null}
                        </span>
                        <Toggle size="lg" checked={on} disabled={!canEdit} onChange={(next) => toggle(key, next)} label={PermissionLabel[key]} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {!anySwitchable ? (
        <p className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken/60 px-4 py-3 text-[13px] text-ink-muted">
          <Lock className="size-4" /> {readOnlyReason ?? 'Admins always have every permission.'}
        </p>
      ) : (
      /* Save bar: sticks to the bottom of the screen while there are unsaved changes. */
      <div
        className={cn(
          'sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5 transition-colors',
          dirty ? 'border-brand/30 bg-surface shadow-[0_6px_24px_rgba(11,21,36,0.12)]' : 'border-line bg-surface-sunken/60',
        )}
      >
        <p className="text-[13px]">
          {showSaved ? (
            <span className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" /> Saved. Staff with this role see the change on their next click.
            </span>
          ) : !role ? (
            <span className="text-ink-muted">Switch on what this role can open, then create it.</span>
          ) : dirty ? (
            <span className="font-medium text-ink">
              {changes} unsaved {changes === 1 ? 'change' : 'changes'}
            </span>
          ) : (
            <span className="text-ink-muted">All changes saved.</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {role && dirty ? (
            <button
              type="button"
              onClick={() => setSelected(new Set(baseline))}
              className="inline-flex h-9 items-center rounded-md px-3 text-[13.5px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              Discard
            </button>
          ) : null}
          <SaveButton label={role ? 'Save changes' : 'Create role'} disabled={role ? !dirty : selected.size === 0} />
        </div>
      </div>
      )}
    </form>
  );
}
