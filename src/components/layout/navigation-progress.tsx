'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

/** Below this, a navigation feels instant and a bar would only flicker. */
const SHOW_AFTER_MS = 120;
/** Never leave the bar stuck if a navigation is abandoned or errors. */
const GIVE_UP_AFTER_MS = 20_000;

/**
 * A thin bar along the top of the window while a page is loading.
 *
 * The App Router has no "navigation started" event, so this starts on the
 * things that begin one — a click on an internal link, back / forward — and
 * finishes when the URL actually changes. Each route's `loading.tsx` skeleton
 * covers the page area meanwhile; this covers the moment before it appears.
 */
export function NavigationProgress(): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!running.current) return;
    running.current = false;
    clearTimers();
    setProgress(100);
    timers.current.push(
      setTimeout(() => setVisible(false), 200),
      setTimeout(() => setProgress(0), 450),
    );
  }, [clearTimers]);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    clearTimers();
    setProgress(0);
    timers.current.push(
      setTimeout(() => {
        setVisible(true);
        setProgress(12);
        // Ease towards 90% — never 100 until the page has actually arrived.
        trickle.current = setInterval(() => setProgress((value) => value + (90 - value) * 0.08), 200);
      }, SHOW_AFTER_MS),
      setTimeout(finish, GIVE_UP_AFTER_MS),
    );
  }, [clearTimers, finish]);

  // The URL changed: the new page is in.
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    function onClick(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !anchor.href || anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or only the #fragment differs): nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }
    const onPopState = (): void => start();

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className={cn(
          'h-full bg-brand shadow-[0_0_8px_var(--color-brand)] transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
