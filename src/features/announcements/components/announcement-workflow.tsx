'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';

import { TextArea } from '@/components/ui/field';
import { FormError } from '@/features/auth/components/form-parts';
import { transitionAnnouncement, type TransitionState } from '@/features/announcements/actions';
import type { AnnouncementDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: TransitionState = { error: null };

const Base = 'inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-50';
const Primary = cn(Base, 'border-transparent bg-brand text-white hover:bg-brand-deep');
const Secondary = cn(Base, 'border-line-strong bg-surface text-ink hover:bg-surface-sunken');
const Danger = cn(Base, 'border-danger/30 bg-surface text-danger hover:bg-danger-soft');

/** The buttons this person may press now. The API enforces the same rules; this only hides what would be refused. */
export function AnnouncementWorkflow({ announcement }: { announcement: AnnouncementDetail }): React.JSX.Element {
  const [state, action, pending] = useActionState(transitionAnnouncement, Initial);
  const { can } = announcement;
  const nothing = !Object.values(can).some(Boolean);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={announcement.id} />
      <FormError message={state.error} />
      {state.done ? (
        <p className="flex items-center gap-2 text-[12.5px] text-success">
          <CheckCircle2 className="size-4" /> {state.done}
        </p>
      ) : null}

      {announcement.status === 'PENDING_APPROVAL' && !can.approve ? (
        <p className="text-[12.5px] text-ink-muted">Waiting for a colleague to approve it. You can't approve your own announcement.</p>
      ) : null}

      {can.reject ? (
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-ink-muted">Reason, if rejecting</span>
          <TextArea name="reason" maxLength={300} rows={2} placeholder="What the author should change" />
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {can.edit ? (
          <Link href={`/announcements/${announcement.id}/edit`} className={Secondary}>
            Edit
          </Link>
        ) : null}
        {can.submit ? (
          <button type="submit" name="action" value="submit" disabled={pending} className={Primary}>
            Send for approval
          </button>
        ) : null}
        {can.approve ? (
          <button type="submit" name="action" value="approve" disabled={pending} className={Primary}>
            Approve
          </button>
        ) : null}
        {can.reject ? (
          <button type="submit" name="action" value="reject" disabled={pending} className={Danger}>
            Reject
          </button>
        ) : null}
        {can.end ? (
          <button type="submit" name="action" value="end" disabled={pending} className={Danger}>
            End banner now
          </button>
        ) : null}
        {can.cancel ? (
          <button type="submit" name="action" value="cancel" disabled={pending} className={Secondary}>
            Cancel
          </button>
        ) : null}
      </div>
      {nothing && announcement.status !== 'PENDING_APPROVAL' ? <p className="text-[12.5px] text-ink-muted">Nothing left to do on this one.</p> : null}
    </form>
  );
}
