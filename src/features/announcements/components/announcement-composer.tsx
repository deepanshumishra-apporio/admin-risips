'use client';

import { AlertTriangle, CheckCircle2, Gift, Save, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/field';
import { FormError } from '@/features/auth/components/form-parts';
import { reachOf, saveAnnouncement } from '@/features/announcements/actions';
import {
  AudienceHint,
  AudienceLabel,
  Audiences,
  CategoryLabel,
  CtaActionLabel,
  CtaActions,
  Guardrails,
  Templates,
} from '@/features/announcements/labels';
import { PhonePreview } from '@/features/notifications/components/phone-preview';
import type { AnnouncementCategory, AnnouncementInput, AudienceReach, CtaAction } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

const IstOffsetMs = 5.5 * 3_600_000;
/** A `datetime-local` value is India time; the API takes an instant. */
const toLocal = (iso: string): string => new Date(Date.parse(iso) + IstOffsetMs).toISOString().slice(0, 16);
const fromLocal = (value: string): string => new Date(`${value}:00+05:30`).toISOString();

const blank = (): AnnouncementInput => {
  const start = new Date(Date.now() + 15 * 60_000);
  return {
    name: '', category: 'PROMOTIONAL', audience: 'ALL_INVESTORS', title: '', body: '',
    sendNotification: true, showBanner: false, tag: null, bannerTitle: null, bannerBody: null, highlight: null,
    ctaLabel: null, ctaAction: null, startsAt: start.toISOString(), endsAt: null,
  };
};

const orNull = (value: string): string | null => (value.trim() ? value : null);

export function AnnouncementComposer({ existing }: { existing?: { id: string; input: AnnouncementInput } }): React.JSX.Element {
  const router = useRouter();
  const [input, setInput] = useState<AnnouncementInput>(existing?.input ?? blank());
  const [reach, setReach] = useState<AudienceReach | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const set = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let live = true;
    void reachOf(input.audience, input.category).then((result) => {
      if (live) setReach(result);
    });
    return () => {
      live = false;
    };
  }, [input.audience, input.category]);

  const promotional = input.category === 'PROMOTIONAL';
  const blockers: string[] = [];
  if (!input.name.trim()) blockers.push('Give it an internal name.');
  if (!input.title.trim() || !input.body.trim()) blockers.push('Write the title and the message.');
  if (!input.sendNotification && !input.showBanner) blockers.push('Choose a notification, a home banner, or both.');
  if (input.showBanner && (!input.tag || !input.bannerTitle || !input.bannerBody)) blockers.push('A banner needs a tag, a banner title and a banner line.');
  if (input.showBanner && !input.endsAt) blockers.push('A banner needs an end date.');
  if (input.endsAt && input.endsAt <= input.startsAt) blockers.push('The end must be after the start.');
  if (reach && reach.reachable === 0) blockers.push('This audience currently reaches nobody.');

  const save = (): void => {
    setError(null);
    startSaving(async () => {
      const result = await saveAnnouncement(existing?.id ?? null, input);
      if (result.error !== null) setError(result.error);
      else router.push(`/announcements/${result.id}`);
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {!existing ? (
          <Card>
            <CardHeader title="Start from" subtitle="Approved starting copy. Edit it to fit — any offer must match one the business is running." />
            <CardBody className="flex flex-wrap gap-2">
              {Templates.map((template) => (
                <Chip key={template.id} label={template.label} onClick={() => setInput((current) => ({ ...current, ...template.input }))} />
              ))}
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Audience" subtitle="A rule, evaluated when it is sent — so it reaches whoever fits at that moment." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Audiences.map((audience) => (
                <Chip key={audience} label={AudienceLabel[audience]} selected={input.audience === audience} onClick={() => set('audience', audience)} />
              ))}
            </div>
            <p className="text-[12.5px] text-ink-muted">{AudienceHint[input.audience]}</p>
            <div className="flex gap-2">
              {(['PROMOTIONAL', 'INFORMATIONAL'] as AnnouncementCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => set('category', category)}
                  className={cn(
                    'h-9 rounded-md border px-4 text-[13px] font-medium transition-colors',
                    input.category === category ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong bg-surface text-ink-soft hover:border-brand/40',
                  )}
                >
                  {CategoryLabel[category]}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-line bg-surface-sunken px-3 py-2.5 text-[12.5px] text-ink-soft">
              {reach ? (
                <>
                  <span className="font-semibold text-ink">{AudienceLabel[input.audience]}</span> matches{' '}
                  <span className="tabular font-semibold text-ink">{formatCount(reach.matched)}</span> investors
                  {reach.optedOut > 0 ? (
                    <>
                      , {formatCount(reach.optedOut)} opted out of offers — reaching{' '}
                      <span className="tabular font-semibold text-ink">{formatCount(reach.reachable)}</span>
                    </>
                  ) : null}
                  .
                </>
              ) : (
                'Counting…'
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Message" subtitle="{{firstName}} fills in each investor's first name." />
          <CardBody className="space-y-4">
            <Field label="Internal name" required hint="Only staff see this.">
              <TextInput value={input.name} maxLength={120} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Diwali SIP push 2026" />
            </Field>
            <Field label="Title" required>
              <TextInput value={input.title} maxLength={80} onChange={(event) => set('title', event.target.value)} />
            </Field>
            <Field label="Message" required hint={`${input.body.length}/240`}>
              <TextArea value={input.body} maxLength={240} rows={3} onChange={(event) => set('body', event.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-4 text-[13px] text-ink-soft">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={input.sendNotification} onChange={(event) => set('sendNotification', event.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                In-app notification
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={input.showBanner} onChange={(event) => set('showBanner', event.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                Home banner and pop-up
              </label>
            </div>
          </CardBody>
        </Card>

        {input.showBanner ? (
          <Card>
            <CardHeader title="Home banner" subtitle="Shows on the investor's Home screen until the end date; the pop-up opens once per investor." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Tag" required hint="The pill above the pop-up title, e.g. FESTIVE OFFER.">
                <TextInput value={input.tag ?? ''} maxLength={30} onChange={(event) => set('tag', orNull(event.target.value.toUpperCase()))} />
              </Field>
              <Field label="Highlight" hint="The boxed line, e.g. the reward. Optional.">
                <TextInput value={input.highlight ?? ''} maxLength={80} onChange={(event) => set('highlight', orNull(event.target.value))} />
              </Field>
              <Field label="Banner title" required>
                <TextInput value={input.bannerTitle ?? ''} maxLength={60} onChange={(event) => set('bannerTitle', orNull(event.target.value))} />
              </Field>
              <Field label="Banner line" required>
                <TextInput value={input.bannerBody ?? ''} maxLength={120} onChange={(event) => set('bannerBody', orNull(event.target.value))} />
              </Field>
              <Field label="Button goes to">
                <SelectInput value={input.ctaAction ?? 'none'} onChange={(event) => set('ctaAction', event.target.value as CtaAction)}>
                  {CtaActions.map((action) => (
                    <option key={action} value={action}>
                      {CtaActionLabel[action]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Button label">
                <TextInput
                  value={input.ctaLabel ?? ''}
                  maxLength={30}
                  disabled={!input.ctaAction || input.ctaAction === 'none'}
                  onChange={(event) => set('ctaLabel', orNull(event.target.value))}
                  placeholder="e.g. Start a SIP"
                />
              </Field>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="Schedule"
            subtitle={promotional ? `Promotional messages never go out ${Guardrails.quietFrom}–${Guardrails.quietTo}; one due then waits for the morning.` : 'Goes out at the start time, once approved.'}
          />
          <CardBody className="grid max-w-lg gap-4 sm:grid-cols-2">
            <Field label="Starts (India time)" required>
              <TextInput type="datetime-local" value={toLocal(input.startsAt)} onChange={(event) => event.target.value && set('startsAt', fromLocal(event.target.value))} />
            </Field>
            <Field label={input.showBanner ? 'Banner ends' : 'Ends (optional)'} required={input.showBanner}>
              <TextInput
                type="datetime-local"
                value={input.endsAt ? toLocal(input.endsAt) : ''}
                onChange={(event) => set('endsAt', event.target.value ? fromLocal(event.target.value) : null)}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        {input.sendNotification ? <PhonePreview title={input.title.replaceAll('{{firstName}}', 'Asha')} body={input.body.replaceAll('{{firstName}}', 'Asha')} deepLink="the Notifications screen" /> : null}

        {input.showBanner ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#F2B84B]/30 bg-[linear-gradient(90deg,rgba(242,184,75,0.22),#161E2D)] p-4 text-white">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F2B84B]/15">
              <Gift className="size-5 text-[#F2B84B]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{input.bannerTitle || 'Banner title'}</span>
              <span className="block truncate text-[12.5px] text-white/70">{input.bannerBody || 'Banner line'}</span>
            </span>
          </div>
        ) : null}

        <Card>
          <CardHeader title="Guardrails" subtitle="Applied when it is sent" />
          <CardBody className="space-y-2.5">
            {[
              promotional ? `Skips investors who turned off offers` : 'Informational — goes to everyone in the audience',
              promotional ? `At most ${Guardrails.weeklyCap} promotional announcements per investor per week` : 'Not counted against the weekly promotional cap',
              promotional ? `Held outside ${Guardrails.quietFrom}–${Guardrails.quietTo}` : 'Sent at the start time',
              'Approved by someone other than the author; every step is audited',
            ].map((rule) => (
              <p key={rule} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                {rule}
              </p>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <FormError message={error} />
            {blockers.length > 0 ? (
              <ul className="space-y-1.5">
                {blockers.map((blocker) => (
                  <li key={blocker} className="flex items-start gap-2 text-[12.5px] text-warn">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {blocker}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-start gap-2 text-[12.5px] text-success">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                Ready. Save it, then send it for approval.
              </p>
            )}
            <Button variant="primary" icon={<Save className="size-4" />} disabled={saving || !input.name.trim() || !input.title.trim() || !input.body.trim()} onClick={save} className="w-full">
              {existing ? 'Save changes' : 'Save draft'}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
