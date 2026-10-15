'use client';

import { CheckCircle2 } from 'lucide-react';
import { useActionState } from 'react';

import { SelectInput, TextArea } from '@/components/ui/field';
import { FormError } from '@/features/auth/components/form-parts';
import { actOnAlert, type AlertFormState } from '@/features/compliance/actions';
import type { ComplianceAlertDetail, StaffRef } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: AlertFormState = { error: null };

const ButtonClass = 'inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-50';
const Primary = cn(ButtonClass, 'border-transparent bg-brand text-white hover:bg-brand-strong');
const Secondary = cn(ButtonClass, 'border-line-strong bg-surface text-ink hover:bg-surface-sunken');
const Danger = cn(ButtonClass, 'border-danger/30 bg-surface text-danger hover:bg-danger-soft');

/**
 * Everything staff can do to an alert, as one form: the button pressed is the
 * action (`name="type"`), and the note travels with resolve, dismiss and note.
 */
export function AlertActions({ alert, assignees }: { alert: ComplianceAlertDetail; assignees: StaffRef[] }): React.JSX.Element {
  const [state, action, pending] = useActionState(actOnAlert, Initial);
  const live = alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED';
  const remindedRecently = alert.lastRemindedAt !== null && Date.now() - Date.parse(alert.lastRemindedAt) < 86_400_000;
  const options = alert.assignee && !assignees.some((a) => a.id === alert.assignee?.id) ? [alert.assignee, ...assignees] : assignees;

  return (
    <div className="space-y-4">
      <FormError message={state.error} />
      {state.done ? (
        <p className="flex items-center gap-2 text-[12.5px] text-success">
          <CheckCircle2 className="size-4" /> {state.done}
        </p>
      ) : null}

      {live ? (
        <form action={action} className="flex items-end gap-2">
          <input type="hidden" name="alertId" value={alert.id} />
          <label className="flex-1">
            <span className="mb-1 block text-[12px] font-medium text-ink-muted">Assignee</span>
            <SelectInput name="assigneeId" defaultValue={alert.assignee?.id ?? ''} key={alert.assignee?.id ?? 'none'}>
              <option value="">Unassigned</option>
              {options.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </SelectInput>
          </label>
          <button type="submit" name="type" value="assign" disabled={pending} className={cn(Secondary, 'h-10')}>
            Assign
          </button>
        </form>
      ) : null}

      <form action={action} className="space-y-2">
        <input type="hidden" name="alertId" value={alert.id} />
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-ink-muted">
            {live ? 'Note — required to resolve or dismiss' : 'Note'}
          </span>
          <TextArea name="note" maxLength={500} rows={3} placeholder={live ? 'What was done, or why this is not a problem' : 'Why it is being reopened (optional)'} />
        </label>
        <div className="flex flex-wrap gap-2">
          {alert.status === 'OPEN' ? (
            <button type="submit" name="type" value="acknowledge" disabled={pending} className={Secondary} formNoValidate>
              Acknowledge
            </button>
          ) : null}
          {live ? (
            <>
              <button type="submit" name="type" value="resolve" disabled={pending} className={Primary}>
                Resolve
              </button>
              <button type="submit" name="type" value="dismiss" disabled={pending} className={Danger}>
                Dismiss
              </button>
            </>
          ) : (
            <button type="submit" name="type" value="reopen" disabled={pending} className={Secondary}>
              Reopen
            </button>
          )}
          <button type="submit" name="type" value="note" disabled={pending} className={Secondary}>
            Add note
          </button>
        </div>
      </form>

      {live && alert.canRemind ? (
        <form action={action} className="rounded-lg border border-line bg-surface-sunken/60 px-3 py-2.5">
          <input type="hidden" name="alertId" value={alert.id} />
          <p className="text-[12.5px] text-ink-soft">
            Send the investor an in-app notification asking them to fix this. Once a day at most.
          </p>
          <button type="submit" name="type" value="remind" disabled={pending || remindedRecently} className={cn(Secondary, 'mt-2')}>
            {remindedRecently ? 'Reminded in the last day' : 'Remind investor'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
