import { PermissionLabel } from '@/features/staff/labels';
import type { Role } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

type RolePickerProps = {
  roles: Role[];
  selected: string[];
  disabled?: boolean;
};

/** Checkboxes named `roleKeys`, each showing exactly what the role grants. */
export function RolePicker({ roles, selected, disabled = false }: RolePickerProps): React.JSX.Element {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Roles</legend>
      {roles.map((role) => (
        <label
          key={role.key}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            type="checkbox"
            name="roleKeys"
            value={role.key}
            defaultChecked={selected.includes(role.key)}
            className="mt-0.5 size-4 accent-[var(--color-brand)]"
          />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium text-ink">{role.name}</span>
            {role.description ? <span className="block text-[12px] text-ink-muted">{role.description}</span> : null}
            <span className="mt-1 flex flex-wrap gap-1">
              {role.permissions.map((permission) => (
                <span key={permission} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink-soft">
                  {PermissionLabel[permission]}
                </span>
              ))}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
