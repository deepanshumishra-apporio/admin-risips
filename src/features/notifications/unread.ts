'use client';

import { useSyncExternalStore } from 'react';

// The unread count, shared by the bell (which polls the feed) and the sidebar's Inbox badge.
let unread = 0;
const listeners = new Set<() => void>();

export function setUnread(n: number): void {
  if (n === unread) return;
  unread = n;
  for (const l of listeners) l();
}

export function useUnread(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => unread,
    () => 0,
  );
}

/** "just now", "5m", "3h", "2d": against the real clock (the demo pages pin theirs). */
export function ago(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}
