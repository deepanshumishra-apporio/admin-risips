'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Re-renders the page's server components every few seconds while the tab is
 * visible, so a live chat shows the investor's messages as they arrive. The
 * browser never talks to the API; this only asks Next to render again.
 */
export function AutoRefresh({ everyMs = 4000 }: { everyMs?: number }): null {
  const router = useRouter();
  useEffect(() => {
    const tick = (): void => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const timer = setInterval(tick, everyMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, everyMs]);
  return null;
}
