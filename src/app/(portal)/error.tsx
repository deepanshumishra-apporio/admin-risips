'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * A page that failed to load — usually the API being unreachable. The shell
 * stays up, and the message never includes the underlying error: in
 * production Next replaces it with a digest anyway, and it may name internals.
 */
export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={<AlertTriangle className="size-5" />}
        title="This page couldn't load"
        description={`Something went wrong while fetching the data. Try again in a moment.${error.digest ? ` Reference: ${error.digest}` : ''}`}
        action={
          <Button onClick={reset} icon={<RotateCw className="size-4" />}>
            Try again
          </Button>
        }
      />
    </Card>
  );
}
