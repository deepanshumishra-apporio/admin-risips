'use client';

import { Ban, KeyRound, LogOut, PlayCircle, Smartphone, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { FormError } from '@/features/auth/components/form-parts';
import { runStaffCommand, type StaffCommand, type StaffFormState } from '@/features/staff/actions';
import { TemporaryPasswordReveal } from '@/features/staff/components/temporary-password';
import type { StaffDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: StaffFormState = { error: null };

type Command = { command: StaffCommand; label: string; action: string; detail: string; icon: LucideIcon; danger?: boolean };

function securityCommands(staff: StaffDetail): Command[] {
  return [
    { command: 'reset-password', label: 'Reset password', action: 'Reset', detail: 'Issues a temporary one', icon: KeyRound },
    { command: 'reset-mfa', label: 'Reset two-factor', action: 'Reset', detail: 'For a lost phone', icon: Smartphone },
    {
      command: 'revoke-sessions',
      label: 'Sign out everywhere',
      action: 'Sign out',
      detail: `${staff.activeSessions} active session${staff.activeSessions === 1 ? '' : 's'}`,
      icon: LogOut,
    },
  ];
}

function dangerCommands(staff: StaffDetail): Command[] {
  return [
    staff.status === 'ACTIVE'
      ? { command: 'suspend', label: 'Suspend', action: 'Suspend', detail: 'Blocks sign-in until reactivated', icon: Ban, danger: true }
      : { command: 'reactivate', label: 'Reactivate', action: 'Reactivate', detail: 'Lets them sign in again', icon: PlayCircle },
    { command: 'deactivate', label: 'Deactivate', action: 'Deactivate', detail: 'Permanent, for leavers', icon: UserX, danger: true },
  ];
}

/**
 * Two clicks for anything: the first arms the button, the second runs it.
 *
 * Always a submit button whose first click is cancelled. Switching `type`
 * from "button" to "submit" on the first click does not work: React commits
 * the new type before the browser runs the click's default action, so that
 * same click would submit the form.
 */
function ConfirmButton({ label, danger }: { label: string; danger?: boolean }): React.JSX.Element {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (armed) return;
        event.preventDefault();
        setArmed(true);
      }}
      onBlur={() => setArmed(false)}
      className={cn(
        'h-8 min-w-[76px] shrink-0 rounded-md border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-60',
        armed
          ? danger ? 'border-danger bg-danger text-white' : 'border-brand bg-brand text-white'
          : danger ? 'border-danger/30 text-danger hover:bg-danger-soft' : 'border-line-strong text-ink hover:bg-surface-sunken',
      )}
    >
      {pending ? 'Working…' : armed ? 'Confirm' : label}
    </button>
  );
}

function CommandList({ staff, commands }: { staff: StaffDetail; commands: Command[] }): React.JSX.Element {
  const [state, action] = useActionState(runStaffCommand, Initial);

  return (
    <div className="space-y-3">
      <FormError message={state.error} />
      {state.temporaryPassword ? <TemporaryPasswordReveal password={state.temporaryPassword} email={staff.email} /> : null}
      <ul className="space-y-1">
        {commands.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.command}>
              <form action={action} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <input type="hidden" name="staffId" value={staff.id} />
                <input type="hidden" name="command" value={item.command} />
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    item.danger ? 'bg-danger-soft text-danger' : 'bg-surface-sunken text-ink-soft',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[13.5px] font-medium', item.danger ? 'text-danger' : 'text-ink')}>{item.label}</span>
                  <span className="block text-[12px] leading-snug text-ink-muted">{item.detail}</span>
                </span>
                <ConfirmButton label={item.action} {...(item.danger && { danger: true })} />
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SecurityCommands({ staff }: { staff: StaffDetail }): React.JSX.Element {
  return <CommandList staff={staff} commands={securityCommands(staff)} />;
}

export function DangerCommands({ staff }: { staff: StaffDetail }): React.JSX.Element {
  return <CommandList staff={staff} commands={dangerCommands(staff)} />;
}
