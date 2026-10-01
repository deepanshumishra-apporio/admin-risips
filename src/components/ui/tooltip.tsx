'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const ShowDelay = 90;

type Position = { top: number; left: number };

type TooltipProps = {
  label: string;
  children: ReactNode;
  /** When true the wrapper is transparent — used for the expanded sidebar. */
  disabled?: boolean;
  /** Secondary line, e.g. a keyboard shortcut. */
  hint?: string;
};

/**
 * Positioned with `fixed` coordinates measured from the trigger rather than
 * absolutely inside it: the collapsed rail scrolls and clips its overflow, so
 * a tooltip laid out inside that box would be cut off at the rail's edge.
 */
export function Tooltip({ label, children, disabled = false, hint }: TooltipProps): React.JSX.Element {
  const [position, setPosition] = useState<Position | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((): void => {
    if (disabled) return;

    timerRef.current = setTimeout(() => {
      /* The wrapper is `display: contents`, so it has no box of its own and
         measures as an empty rect — the trigger to measure is its child. */
      const node = anchorRef.current?.firstElementChild ?? anchorRef.current;
      const rect = node?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;

      setPosition({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    }, ShowDelay);
  }, [disabled]);

  const hide = useCallback((): void => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setPosition(null);
  }, []);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
        className="contents"
      >
        {children}
      </span>

      {position !== null ? (
        <span
          role="tooltip"
          style={{ top: position.top, left: position.left }}
          className="pointer-events-none fixed z-[70] -translate-y-1/2 rounded-md bg-navy px-2 py-1.5 text-[12px] leading-tight whitespace-nowrap text-white shadow-[0_6px_18px_rgba(11,21,36,0.24)]"
        >
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-navy"
          />
          {label}
          {hint !== undefined ? <span className="ml-1.5 text-white/50">{hint}</span> : null}
        </span>
      ) : null}
    </>
  );
}
