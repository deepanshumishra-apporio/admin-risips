'use client';

import { CalendarPlus, ClipboardList, MapPin, Phone, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/field';
import { SidePanel } from '@/components/ui/side-panel';
import { Tabs } from '@/components/ui/tabs';
import { advanceMeeting, recordMeeting, searchMeetingInvestors, type MeetingFormState } from '@/features/meetings/actions';
import type {
  MeetingInvestorOption,
  MeetingMode,
  MeetingStatus,
  ReviewMeetingItem,
  ReviewMeetingList,
  RiskProfile,
  StaffRef,
} from '@/types/admin-api.types';
import { formatDate } from '@/utils/format';

const StatusLabel: Record<MeetingStatus, string> = { SCHEDULED: 'Scheduled', CAPTURED: 'Captured', PROFILE_UPDATED: 'Profile updated' };
const StatusTone: Record<MeetingStatus, BadgeTone> = { SCHEDULED: 'brand', CAPTURED: 'warn', PROFILE_UPDATED: 'success' };
const ModeLabel: Record<MeetingMode, string> = { IN_PERSON: 'In person', VIDEO: 'Video', PHONE: 'Phone' };
const ModeIcon = { IN_PERSON: MapPin, VIDEO: Video, PHONE: Phone } as const;
const ProfileLabel: Record<RiskProfile, string> = { CONSERVATIVE: 'Conservative', MODERATE: 'Moderate', AGGRESSIVE: 'Aggressive' };
const Profiles = Object.keys(ProfileLabel) as RiskProfile[];
const Modes = Object.keys(ModeLabel) as MeetingMode[];

const TabLabels = ['All', 'Scheduled', 'Captured', 'Profile updated'] as const;
type TabLabel = (typeof TabLabels)[number];
const TabStatus: Record<TabLabel, MeetingStatus | null> = { All: null, Scheduled: 'SCHEDULED', Captured: 'CAPTURED', 'Profile updated': 'PROFILE_UPDATED' };

const Initial: MeetingFormState = { error: null };
const todayIst = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

type BoardProps = {
  meetings: ReviewMeetingList;
  status: MeetingStatus | null;
  conductors: StaffRef[];
  meId: string;
};

/** The meeting log, backed by the admin API. Every record is written once and audit-logged. */
export function ReviewMeetingsBoard({ meetings, status, conductors, meId }: BoardProps): React.JSX.Element {
  const router = useRouter();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [capturing, setCapturing] = useState<ReviewMeetingItem | null>(null);
  const active = (Object.keys(TabStatus) as TabLabel[]).find((label) => TabStatus[label] === status) ?? 'All';
  const total = meetings.counts.SCHEDULED + meetings.counts.CAPTURED + meetings.counts.PROFILE_UPDATED;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={TabLabels}
            active={active}
            onChange={(label) => {
              const next = TabStatus[label];
              router.push(next ? `/review-meetings?status=${next.toLowerCase()}` : '/review-meetings');
            }}
          />
          <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => setCaptureOpen(true)}>
            Record meeting
          </Button>
        </div>

        <Card>
          <CardHeader
            title="Meeting log"
            subtitle={`${meetings.counts.SCHEDULED} scheduled · ${meetings.counts.CAPTURED} captured · ${meetings.counts.PROFILE_UPDATED} profile updated`}
            action={<span className="text-[12.5px] text-ink-muted">{meetings.items.length} shown of {total}</span>}
          />

          {meetings.items.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-5" />}
              title={status ? `No ${StatusLabel[status].toLowerCase()} meetings` : 'No meetings recorded yet'}
              description="Record a review meeting after you speak with an investor about their circumstances."
            />
          ) : (
            <ul className="divide-y divide-line">
              {meetings.items.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} onCapture={() => setCapturing(meeting)} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <RecordMeetingPanel open={captureOpen} onClose={() => setCaptureOpen(false)} conductors={conductors} meId={meId} />
      <CaptureNotesPanel meeting={capturing} onClose={() => setCapturing(null)} />
    </>
  );
}

function MeetingRow({ meeting, onCapture }: { meeting: ReviewMeetingItem; onCapture: () => void }): React.JSX.Element {
  const Icon = ModeIcon[meeting.mode];
  const changed = meeting.currentProfile !== meeting.recommendedProfile;
  const [state, action, pending] = useActionState(advanceMeeting, Initial);
  const name = meeting.investor.name ?? 'Investor';

  return (
    <li className="flex flex-wrap items-start gap-4 px-5 py-4">
      <Avatar name={name} tone="violet" />

      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13.5px] font-semibold text-ink">{name}</p>
          {meeting.investor.phone ? <span className="tabular text-[12px] text-ink-muted">{meeting.investor.phone}</span> : null}
          <Badge tone={StatusTone[meeting.status]} dot>
            {StatusLabel[meeting.status]}
          </Badge>
        </div>
        <p className="mt-1 flex items-center gap-2 text-[12px] text-ink-muted">
          <Icon className="size-3.5" />
          {ModeLabel[meeting.mode]} · {formatDate(meeting.meetingDate)} · {meeting.conductedBy.name}
          {meeting.recordedBy.id !== meeting.conductedBy.id ? ` (recorded by ${meeting.recordedBy.name})` : ''}
        </p>
        {meeting.notes ? (
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed whitespace-pre-line text-ink-soft">{meeting.notes}</p>
        ) : (
          <p className="mt-2 text-[12.5px] text-ink-muted italic">No notes yet.</p>
        )}
        {state.error ? <p className="mt-2 text-[12.5px] text-danger">{state.error}</p> : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{ProfileLabel[meeting.currentProfile]}</Badge>
          {changed ? (
            <>
              <span className="text-ink-muted">→</span>
              <Badge tone="brand">{ProfileLabel[meeting.recommendedProfile]}</Badge>
            </>
          ) : null}
        </div>
        {meeting.status === 'SCHEDULED' ? (
          <Button onClick={onCapture}>Capture notes</Button>
        ) : meeting.status === 'CAPTURED' ? (
          <form
            action={action}
            onSubmit={(event) => {
              if (!window.confirm('Mark the profile as updated? The meeting record becomes final and can no longer be edited.')) event.preventDefault();
            }}
          >
            <input type="hidden" name="meetingId" value={meeting.id} />
            <input type="hidden" name="status" value="PROFILE_UPDATED" />
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Mark profile updated'}
            </Button>
          </form>
        ) : null}
      </div>
    </li>
  );
}

function RecordMeetingPanel({
  open,
  onClose,
  conductors,
  meId,
}: {
  open: boolean;
  onClose: () => void;
  conductors: StaffRef[];
  meId: string;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(recordMeeting, Initial);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<MeetingInvestorOption[]>([]);
  const [chosen, setChosen] = useState<MeetingInvestorOption | null>(null);
  const [searching, startSearch] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Debounced search against the API: names and phone numbers, masked.
  useEffect(() => {
    if (chosen || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(() => startSearch(async () => setOptions(await searchMeetingInvestors(query))), 300);
    return () => clearTimeout(timer);
  }, [query, chosen]);

  // A saved meeting closes the panel and clears the form for the next one.
  useEffect(() => {
    if (state.done) {
      formRef.current?.reset();
      setChosen(null);
      setQuery('');
      onClose();
    }
  }, [state, onClose]);

  return (
    <SidePanel
      open={open}
      title="Record review meeting"
      subtitle="A meeting dated in the future is saved as scheduled; one that happened needs its notes."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="record-meeting" disabled={pending || !chosen}>
            {pending ? 'Saving…' : 'Save meeting'}
          </Button>
        </div>
      }
    >
      <form id="record-meeting" ref={formRef} action={action} className="space-y-4">
        <Field label="Investor" required hint={chosen ? undefined : 'Search by name or mobile number.'}>
          {chosen ? (
            <div className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-[13.5px]">
              <span>
                {chosen.name ?? 'Investor'} <span className="tabular text-ink-muted">{chosen.phone}</span>
              </span>
              <button type="button" className="text-[12.5px] font-medium text-brand" onClick={() => setChosen(null)}>
                Change
              </button>
            </div>
          ) : (
            <div>
              <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Ananya or 98765" autoComplete="off" />
              {searching ? <p className="mt-1.5 text-[12px] text-ink-muted">Searching…</p> : null}
              {options.length > 0 ? (
                <ul className="mt-1.5 divide-y divide-line rounded-md border border-line">
                  {options.map((option) => (
                    <li key={option.id}>
                      <button type="button" className="w-full px-3 py-2 text-left text-[13px] hover:bg-surface-sunken" onClick={() => setChosen(option)}>
                        {option.name ?? 'Unnamed investor'} <span className="tabular text-ink-muted">{option.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!searching && query.trim().length >= 2 && options.length === 0 ? (
                <p className="mt-1.5 text-[12px] text-ink-muted">No investors match.</p>
              ) : null}
            </div>
          )}
          <input type="hidden" name="userId" value={chosen?.id ?? ''} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Meeting date" required>
            <TextInput type="date" name="meetingDate" defaultValue={todayIst()} required />
          </Field>
          <Field label="Mode">
            <SelectInput name="mode" defaultValue="IN_PERSON">
              {Modes.map((mode) => (
                <option key={mode} value={mode}>
                  {ModeLabel[mode]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Conducted by">
          <SelectInput name="conductedByStaffId" defaultValue={meId}>
            {conductors.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
                {staff.id === meId ? ' (you)' : ''}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Current profile">
            <SelectInput name="currentProfile" defaultValue="MODERATE">
              {Profiles.map((profile) => (
                <option key={profile} value={profile}>
                  {ProfileLabel[profile]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Recommended profile">
            <SelectInput name="recommendedProfile" defaultValue="MODERATE">
              {Profiles.map((profile) => (
                <option key={profile} value={profile}>
                  {ProfileLabel[profile]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Notes" hint="What changed for the investor, and what the basket should do about it. At least 20 characters once the meeting has happened.">
          <TextArea name="notes" rows={6} maxLength={4000} placeholder="Income, horizon, liquidity needs, comfort with drawdown..." />
        </Field>

        {state.error ? <p className="text-[12.5px] text-danger">{state.error}</p> : null}
      </form>
    </SidePanel>
  );
}

function CaptureNotesPanel({ meeting, onClose }: { meeting: ReviewMeetingItem | null; onClose: () => void }): React.JSX.Element {
  const [state, action, pending] = useActionState(advanceMeeting, Initial);

  useEffect(() => {
    if (state.done) onClose();
  }, [state, onClose]);

  return (
    <SidePanel
      open={meeting !== null}
      title="Capture meeting notes"
      subtitle={meeting ? `${meeting.investor.name ?? 'Investor'}, ${formatDate(meeting.meetingDate)}` : undefined}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="capture-notes" disabled={pending}>
            {pending ? 'Saving…' : 'Save notes'}
          </Button>
        </div>
      }
    >
      <form id="capture-notes" action={action} className="space-y-4">
        <input type="hidden" name="meetingId" value={meeting?.id ?? ''} />
        <input type="hidden" name="status" value="CAPTURED" />
        <Field label="Notes" required hint="At least 20 characters: what was discussed and why the profile should (or should not) change.">
          <TextArea name="notes" rows={8} maxLength={4000} defaultValue={meeting?.notes ?? ''} key={meeting?.id} />
        </Field>
        {state.error ? <p className="text-[12.5px] text-danger">{state.error}</p> : null}
      </form>
    </SidePanel>
  );
}
