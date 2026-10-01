/** Indian-notation money, compacted to Cr / L so table columns stay narrow. */
export function formatInr(amount: number, opts?: { compact?: boolean }): string {
  const compact = opts?.compact ?? true;

  if (compact && Math.abs(amount) >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  if (compact && Math.abs(amount) >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} L`;
  }

  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Signed percentage, used for period-on-period deltas on the KPI tiles. */
export function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-IN');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** API money arrives as a decimal string (never a float on the wire). */
export function formatInrString(amount: string | null | undefined, opts?: { compact?: boolean }): string {
  if (amount === null || amount === undefined) return '—';
  const value = Number(amount);
  return Number.isFinite(value) ? formatInr(value, opts) : '—';
}

/** Date and time in India, for audit-style timestamps. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/** "3h ago" against the real clock (unlike `relativeTime`, which is pinned for mock data). */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  const days = Math.round(minutes / (60 * 24));
  return days < 60 ? `${days}d ago` : formatDate(iso);
}

/** SCREAMING_SNAKE or snake_case from the API → "Sentence case". */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—';
  const text = value.toLowerCase().replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
