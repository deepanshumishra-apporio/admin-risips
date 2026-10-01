'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { runChecks } from '@/features/compliance/actions';

export function RunChecksButton(): React.JSX.Element {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      {message ? <span className="text-[12px] text-ink-muted">{message}</span> : null}
      <Button
        disabled={pending}
        icon={pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        onClick={() =>
          start(async () => {
            const { error, result } = await runChecks();
            if (error || !result) setMessage(error ?? 'The checks could not run.');
            else if (result.mode === 'skipped') setMessage('A scan is already running. Try again in a minute.');
            else setMessage(`${result.raised} new · ${result.reopened} reopened · ${result.autoResolved} cleared`);
          })
        }
      >
        Run checks now
      </Button>
    </span>
  );
}
