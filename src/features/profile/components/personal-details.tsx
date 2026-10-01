'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { CurrentAdmin } from '@/data/profile';

const Timezones = ['Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'Europe/London (GMT)', 'America/New_York (ET)'];

export function PersonalDetails(): React.JSX.Element {
  const [name, setName] = useState(CurrentAdmin.name);
  const [email, setEmail] = useState(CurrentAdmin.email);
  const [phone, setPhone] = useState(CurrentAdmin.phone);
  const [timezone, setTimezone] = useState(CurrentAdmin.timezone);
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== CurrentAdmin.name ||
    email !== CurrentAdmin.email ||
    phone !== CurrentAdmin.phone ||
    timezone !== CurrentAdmin.timezone;

  const save = (): void => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <Card>
      <CardHeader title="Personal details" subtitle="How you appear to other admins and on audit entries." />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} className="size-14 text-[18px]" />
          <div>
            <p className="text-[13px] font-medium text-ink">Profile photo</p>
            <p className="mt-0.5 mb-2 text-[12px] text-ink-muted">
              Initials are used until you upload one. PNG or JPG, up to 2 MB.
            </p>
            <div className="flex gap-2">
              <Button size="sm">Upload</Button>
              <Button size="sm" variant="ghost">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>

          <Field label="Work email" required hint="Used to sign in and to receive alert digests.">
            <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>

          <Field label="Phone">
            <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>

          <Field label="Timezone" hint="Times across the portal are shown in this zone.">
            <SelectInput value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {Timezones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </CardBody>

      <footer className="flex items-center justify-end gap-3 border-t border-line px-4 py-3">
        {saved ? (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
            <Check className="size-3.5" />
            Saved
          </span>
        ) : null}
        <Button variant="primary" disabled={!dirty} onClick={save}>
          Save changes
        </Button>
      </footer>
    </Card>
  );
}
