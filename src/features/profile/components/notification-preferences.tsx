'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import { DefaultChannelPreferences, DefaultWorkspacePreferences } from '@/data/profile';
import type { AdminNotificationKind } from '@/types/notification.types';
import type { ChannelPreference } from '@/types/profile.types';

/** Which admin alerts reach you, and where. Saves as you toggle. */
export function NotificationPreferences(): React.JSX.Element {
  const [preferences, setPreferences] = useState<ChannelPreference[]>(DefaultChannelPreferences);
  const [digest, setDigest] = useState(DefaultWorkspacePreferences.digest);

  const set = (kind: AdminNotificationKind, channel: 'inApp' | 'email', value: boolean): void => {
    setPreferences((current) =>
      current.map((entry) => (entry.kind === kind ? { ...entry, [channel]: value } : entry)),
    );
  };

  return (
    <Card>
      <CardHeader
        title="Notification preferences"
        subtitle="Turning a channel off here silences the alert for you only — it stays in the queue for everyone else."
      />

      <div className="hidden grid-cols-[minmax(0,1fr)_80px_80px] gap-4 border-b border-line px-4 py-2 sm:grid">
        <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">Event</span>
        <span className="text-center text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">
          In-app
        </span>
        <span className="text-center text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">
          Email
        </span>
      </div>

      <ul className="divide-y divide-line">
        {preferences.map((preference) => (
          <li
            key={preference.kind}
            className="grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-ink">{preference.kind}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">{preference.description}</p>
            </div>

            <div className="flex justify-center">
              <Toggle
                checked={preference.inApp}
                onChange={(value) => set(preference.kind, 'inApp', value)}
                label={`${preference.kind} in-app`}
              />
            </div>

            <div className="flex justify-center">
              <Toggle
                checked={preference.email}
                onChange={(value) => set(preference.kind, 'email', value)}
                label={`${preference.kind} email`}
              />
            </div>
          </li>
        ))}
      </ul>

      <CardBody className="grid gap-4 border-t border-line sm:grid-cols-3">
        <Field label="Email digest" hint="Batches anything not sent immediately.">
          <SelectInput
            value={digest}
            onChange={(event) => setDigest(event.target.value as typeof digest)}
          >
            {(['Off', 'Daily', 'Weekly'] as const).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Quiet hours from">
          <TextInput type="time" defaultValue={DefaultWorkspacePreferences.quietHoursFrom} />
        </Field>

        <Field label="Quiet hours to" hint="High-severity alerts ignore quiet hours.">
          <TextInput type="time" defaultValue={DefaultWorkspacePreferences.quietHoursTo} />
        </Field>
      </CardBody>
    </Card>
  );
}
