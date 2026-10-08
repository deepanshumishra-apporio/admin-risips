'use client';

import { KeyRound, Monitor, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, PasswordInput } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import { ActiveSessions } from '@/data/profile';

export function SecuritySettings(): React.JSX.Element {
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Password"
          subtitle="At least 12 characters. Changing it signs out every other session."
        />
        <CardBody className="grid max-w-2xl gap-4 sm:grid-cols-3">
          <Field label="Current password">
            <PasswordInput placeholder="••••••••••••" />
          </Field>
          <Field label="New password">
            <PasswordInput placeholder="••••••••••••" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput placeholder="••••••••••••" />
          </Field>
        </CardBody>
        <footer className="flex justify-end border-t border-line px-4 py-3">
          <Button variant="primary" icon={<KeyRound className="size-4" />}>
            Update password
          </Button>
        </footer>
      </Card>

      <Card>
        <CardHeader title="Two-factor authentication" subtitle="Required for anyone who can publish or approve." />
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="text-[13.5px] font-medium text-ink">Authenticator app</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {twoFactor
                  ? 'Enabled. A code is asked for on a new device or after 30 days.'
                  : 'Disabled. Campaign approval and portfolio publishing will be blocked.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" disabled={!twoFactor}>
              View recovery codes
            </Button>
            <Toggle checked={twoFactor} onChange={setTwoFactor} label="Two-factor authentication" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Active sessions"
          subtitle="Anything you do not recognise should be signed out."
          action={<Button size="sm" variant="danger">Sign out all others</Button>}
        />
        <ul className="divide-y divide-line">
          {ActiveSessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Monitor className="size-4 shrink-0 text-ink-muted" />

              <div className="min-w-[180px] flex-1">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  {session.device}
                  {session.current ? <Badge tone="success">This device</Badge> : null}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {session.browser} · {session.location}
                </p>
              </div>

              <span className="tabular text-[12.5px] text-ink-muted">{session.lastActive}</span>

              {session.current ? null : (
                <Button size="sm" variant="ghost">
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
