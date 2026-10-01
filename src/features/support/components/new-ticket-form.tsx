'use client';

import { useActionState } from 'react';

import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { createTicket, type FormState } from '@/features/support/actions';
import { CategoryLabel, PriorityLabel, SlaHours, TicketCategories, TicketPriorities } from '@/features/support/labels';

const Initial: FormState = { error: null };

export function NewTicketForm({ userId }: { userId: string }): React.JSX.Element {
  const [state, action] = useActionState(createTicket, Initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <FormError message={state.error} />
      <Field label="Subject" required>
        <TextInput name="subject" required maxLength={160} placeholder="e.g. SIP debited but units not allotted" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Came in by" required>
          <SelectInput name="channel" defaultValue="PHONE">
            <option value="PHONE">Phone call</option>
            <option value="EMAIL">Email</option>
          </SelectInput>
        </Field>
        <Field label="Category" required>
          <SelectInput name="category" defaultValue="OTHER">
            {TicketCategories.map((category) => (
              <option key={category} value={category}>
                {CategoryLabel[category]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Priority" required>
          <SelectInput name="priority" defaultValue="NORMAL">
            {TicketPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {PriorityLabel[priority]} · {SlaHours[priority]}h
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field label="What the investor needs" hint="Saved as an internal note. Your first reply to the investor goes out from the ticket." required>
        <TextArea name="body" required maxLength={4000} rows={6} />
      </Field>
      <div className="max-w-xs">
        <SubmitButton>Create ticket</SubmitButton>
      </div>
    </form>
  );
}
