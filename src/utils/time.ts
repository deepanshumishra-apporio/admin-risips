/**
 * The portal runs on fixed demo data, so "now" is pinned rather than read from
 * the clock — otherwise every relative label drifts as the data ages.
 */
export const Now = Date.parse('2026-09-03T12:00:00');

export function relativeTime(iso: string): string {
  const minutes = Math.round((Now - Date.parse(iso)) / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;

  return `${Math.round(minutes / (60 * 24))}d`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Day separator label for a chat transcript. */
export function dayLabel(iso: string): string {
  const days = Math.floor((startOfDay(Now) - startOfDay(Date.parse(iso))) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';

  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
