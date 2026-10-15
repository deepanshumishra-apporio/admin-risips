/**
 * Where to send someone after sign-in. Only a same-site path is honoured —
 * anything a browser would resolve off-site turns the sign-in page into an
 * open redirect for phishing.
 *
 * Prefix checks alone were not enough: `/\t/evil.example` passed them, and the
 * URL parser drops the tab, leaving `//evil.example`. So control characters
 * and backslashes are refused outright, and the result must still resolve to
 * this origin.
 */
const BASE = 'https://admin.invalid';

export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007f\\]/.test(value)) return fallback;
  if (value.startsWith('//')) return fallback;
  if (value.startsWith('/signin') || value.startsWith('/auth')) return fallback;
  let resolved: URL;
  try {
    resolved = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (resolved.origin !== BASE) return fallback;
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
