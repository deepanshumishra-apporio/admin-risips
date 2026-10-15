import 'server-only';

import { headers } from 'next/headers';

import { ApiError } from '@/lib/api/errors';
import { Config } from '@/lib/config';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** The staff session token. Omitted only for sign-in itself. */
  token?: string | null;
  query?: Record<string, string | number | boolean | readonly string[] | null | undefined>;
};

const TimeoutMs = 15_000;

function buildUrl(path: string, query: RequestOptions['query']): string {
  const url = new URL(`${Config.apiUrl}/api/v1/admin${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return url.toString();
}

/**
 * The staff member's own address and browser, passed on so the API's rate
 * limits, lockouts and login history see them rather than this server. The API
 * only believes X-Forwarded-For from hosts listed in its TRUST_PROXY.
 */
async function forwardedHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const forwarded: Record<string, string> = {};
  // Only the address our own edge vouches for. Copying the incoming
  // X-Forwarded-For verbatim passed on whatever the visitor typed, letting them
  // pick a new IP per request to dodge the API's sign-in limits and forge the
  // IPs in login history. `x-real-ip` is set by the hosting edge (Vercel); the
  // fallback is the right-most hop, the one the nearest proxy appended.
  const clientIp = incoming.get('x-real-ip')?.trim() || incoming.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  if (clientIp) forwarded['x-forwarded-for'] = clientIp;
  const userAgent = incoming.get('user-agent');
  if (userAgent) forwarded['user-agent'] = userAgent;
  return forwarded;
}

/**
 * One call to the admin API. Returns the `data` of the envelope, or throws an
 * `ApiError` carrying the API's own code. Never cached: every response here is
 * per-staff-member and much of it is personal data.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, query } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      cache: 'no-store',
      signal: AbortSignal.timeout(TimeoutMs),
      headers: {
        accept: 'application/json',
        ...(await forwardedHeaders()),
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (cause) {
    console.error('[api] request failed', method, path, cause);
    throw new ApiError(503, 'API_UNREACHABLE', 'The RiSips API could not be reached. Try again in a moment.');
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string } & Record<string, unknown> }
    | null;

  if (!response.ok || !payload || payload.error) {
    const { code = 'UNKNOWN', message = 'Something went wrong.', ...details } = payload?.error ?? {};
    throw new ApiError(response.status, code, message, details);
  }
  return payload.data as T;
}

/** Exports scan every matching row, so they get longer than a page render. */
const DownloadTimeoutMs = 60_000;

/**
 * A file from the admin API (a CSV export), returned as the raw response for a
 * route handler to stream on. A failure still arrives as the JSON envelope and
 * is thrown as an `ApiError`, exactly as `apiRequest` does.
 */
export async function apiDownload(path: string, options: Pick<RequestOptions, 'token' | 'query'>): Promise<Response> {
  const { token, query } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      cache: 'no-store',
      signal: AbortSignal.timeout(DownloadTimeoutMs),
      headers: {
        accept: 'text/csv, application/json',
        ...(await forwardedHeaders()),
        ...(token && { authorization: `Bearer ${token}` }),
      },
    });
  } catch (cause) {
    console.error('[api] download failed', path, cause);
    throw new ApiError(503, 'API_UNREACHABLE', 'The RiSips API could not be reached. Try again in a moment.');
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(response.status, payload?.error?.code ?? 'UNKNOWN', payload?.error?.message ?? 'Something went wrong.');
  }
  return response;
}
