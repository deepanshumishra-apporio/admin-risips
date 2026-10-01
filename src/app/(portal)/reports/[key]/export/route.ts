import { NextResponse, type NextRequest } from 'next/server';

import { isReportKey } from '@/features/reports/labels';
import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';

const Forwarded = ['from', 'to', 'status'] as const;

/**
 * Streams a report's CSV from the API to the browser. The browser never talks
 * to the API, so the download comes through this server with the session
 * cookie turned into the bearer token, like every other call. The API checks
 * the permission and writes the audit entry.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }): Promise<Response> {
  const { key } = await params;
  if (!isReportKey(key)) return new NextResponse('Not found', { status: 404 });

  const token = await readSessionToken();
  if (!token) return NextResponse.redirect(new URL('/signin', request.url));

  const query: Record<string, string> = {};
  for (const name of Forwarded) {
    const value = request.nextUrl.searchParams.get(name);
    if (value) query[name] = value;
  }

  try {
    const upstream = await apiDownload(`/reports/${key}/export`, { token, query });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'text/csv; charset=utf-8',
        'content-disposition': upstream.headers.get('content-disposition') ?? `attachment; filename="risips-${key}.csv"`,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) return NextResponse.redirect(new URL('/auth/expired', request.url));
      if (error.code === 'MFA_REQUIRED') return NextResponse.redirect(new URL('/signin/mfa', request.url));
      if (error.code === 'PASSWORD_CHANGE_REQUIRED') return NextResponse.redirect(new URL('/signin/password', request.url));
    }
    console.error('[reports] export failed', key, error);
    const back = new URL(`/reports/${key}`, request.url);
    for (const [name, value] of Object.entries(query)) back.searchParams.set(name, value);
    back.searchParams.set('failed', '1');
    return NextResponse.redirect(back);
  }
}
