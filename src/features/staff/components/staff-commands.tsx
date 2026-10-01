'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { FormError } from '@/features/auth/components/form-parts';
import { runStaffCommand, type StaffCommand, type StaffFormState } from '@/features/staff/actions';
import { TemporaryPasswordReveal } from '@/features/staff/components/temporary-password';
import type { StaffDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: StaffFormState = { error: null };

type Command = { command: StaffCommand; label: string; detail: string; danger?: boolean };

function commandsFor(staff: StaffDetail): Command[] {
  if (staff.status === 'DEACTIVATED') return [];
  const list: Command[] = [
    { command: 'reset-password', label: 'Reset password', detail: 'Issues a temporary password and signs them out.' },
    { command: 'reset-mfa', label: 'Reset two-factor', detail: 'For a lost phone. They set up a new authenticator at next sign-in.' },
    { command: 'revoke-sessions', label: 'Sign out everywhere', detail: `Ends their ${staff.activeSessions} active session${staff.activeSessions === 1 ? '' : 's'}.` },
  ];
  list.push(
    staff.status === 'ACTIVE'
      ? { command: 'suspend', label: 'Suspend', detail: 'Blocks sign-in until reactivated. Signs them out now.', danger: true }
      : { command: 'reactivate', label: 'Reactivate', detail: 'Lets them sign in again.' },
    { command: 'deactivate', label: 'Deactivate', detail: 'For someone who has left. Permanent; their history is kept.', danger: true },
  );
  return list;
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
        'h-8 shrink-0 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-60',
        armed
          ? danger ? 'border-danger bg-danger text-white' : 'border-brand bg-brand text-white'
          : danger ? 'border-danger/30 text-danger hover:bg-danger-soft' : 'border-line-strong text-ink hover:bg-surface-sunken',
      )}
    >
      {pending ? 'Working…' : armed ? 'Click to confirm' : label}
    </button>
  );
}

export function StaffCommands({ staff }: { staff: StaffDetail }): React.JSX.Element {
  const [state, action] = useActionState(runStaffCommand, Initial);
  const commands = commandsFor(staff);

  if (commands.length === 0) {
    return <p className="text-[13px] text-ink-muted">This account is deactivated. It is kept for the audit trail.</p>;
  }

  return (
    <div className="space-y-3">
      <FormError message={state.error} />
      {state.temporaryPassword ? <TemporaryPasswordReveal password={state.temporaryPassword} email={staff.email} /> : null}
      <ul className="divide-y divide-line">
        {commands.map((item) => (
          <li key={item.command}>
            <form action={action} className="flex items-center justify-between gap-4 py-2.5">
              <input type="hidden" name="staffId" value={staff.id} />
              <input type="hidden" name="command" value={item.command} />
              <span className="min-w-0">
                <span className={cn('block text-[13.5px] font-medium', item.danger ? 'text-danger' : 'text-ink')}>{item.label}</span>
                <span className="block text-[12px] text-ink-muted">{item.detail}</span>
              </span>
              <ConfirmButton label={item.label} {...(item.danger && { danger: true })} />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
