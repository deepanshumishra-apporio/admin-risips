/**
 * Where to send someone after sign-in. Only a same-site path is honoured —
 * `//evil.example` and `/\evil.example` are protocol-relative URLs browsers
 * will follow off-site, which would turn the sign-in page into an open
 * redirect for phishing.
 */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.startsWith('/signin') || value.startsWith('/auth')) return fallback;
  return value;
}
