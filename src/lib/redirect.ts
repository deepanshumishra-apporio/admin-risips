import { NextResponse, type NextRequest } from 'next/server';

/**
 * Redirects that work behind the server's proxy. `new URL(path, request.url)`
 * takes its origin from the address Next listens on (127.0.0.1:3000 behind
 * Caddy), so staff were sent to localhost:3000.
 */

/** For route handlers: a 307 with a relative Location, resolved by the browser against the address it is on. */
export function redirectTo(path: string, params?: URLSearchParams | Record<string, string>): NextResponse {
  const query = params ? new URLSearchParams(params).toString() : '';
  return new NextResponse(null, { status: 307, headers: { location: query ? `${path}?${query}` : path } });
}

/**
 * For middleware, which can't send a relative Location (Next parses it as a full
 * URL and rewrites it). Uses the origin the browser asked for, which the proxy
 * passes in X-Forwarded-Host / X-Forwarded-Proto.
 */
export function middlewareRedirect(request: NextRequest, path: string, params?: Record<string, string>): NextResponse {
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || request.nextUrl.protocol.replace(/:$/, '');
  const target = new URL(path, host ? `${proto}://${host}` : request.url);
  for (const [name, value] of Object.entries(params ?? {})) target.searchParams.set(name, value);
  return NextResponse.redirect(target);
}
