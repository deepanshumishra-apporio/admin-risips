'use client';

import { CheckCircle2 } from 'lucide-react';
import { useActionState } from 'react';

import { SelectInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { updateTicket, type FormState } from '@/features/support/actions';
import {
  CategoryLabel,
  PriorityLabel,
  SlaHours,
  StatusLabel,
  TicketCategories,
  TicketPriorities,
  TicketStatuses,
} from '@/features/support/labels';
import type { StaffRef, TicketDetail } from '@/types/admin-api.types';

const Initial: FormState = { error: null };

function Row({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export function TicketProperties({ ticket, agents }: { ticket: TicketDetail; agents: StaffRef[] }): React.JSX.Element {
  const [state, action] = useActionState(updateTicket, Initial);
  // The current assignee may have lost the role since; keep them selectable so saving does not silently unassign.
  const options = ticket.assignee && !agents.some((agent) => agent.id === ticket.assignee?.id) ? [ticket.assignee, ...agents] : agents;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticket.id} />
      <FormError message={state.error} />
      {state.saved ? (
        <p className="flex items-center gap-2 text-[12.5px] text-success">
          <CheckCircle2 className="size-4" /> Saved.
        </p>
      ) : null}
      <Row label="Status">
        <SelectInput name="status" defaultValue={ticket.status} key={`s-${ticket.status}`}>
          {TicketStatuses.map((status) => (
            <option key={status} value={status}>
              {StatusLabel[status]}
            </option>
          ))}
        </SelectInput>
      </Row>
      <Row label="Assignee">
        <SelectInput name="assigneeId" defaultValue={ticket.assignee?.id ?? ''} key={`a-${ticket.assignee?.id ?? ''}`}>
          <option value="">Unassigned</option>
          {options.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </SelectInput>
      </Row>
      <Row label="Priority">
        <SelectInput name="priority" defaultValue={ticket.priority} key={`p-${ticket.priority}`}>
          {TicketPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {PriorityLabel[priority]} · resolve within {SlaHours[priority]}h
            </option>
          ))}
        </SelectInput>
      </Row>
      <Row label="Category">
        <SelectInput name="category" defaultValue={ticket.category} key={`c-${ticket.category}`}>
          {TicketCategories.map((category) => (
            <option key={category} value={category}>
              {CategoryLabel[category]}
            </option>
          ))}
        </SelectInput>
      </Row>
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
