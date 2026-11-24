import { NextResponse, type NextRequest } from 'next/server';

import { parseSipFilters, sipsHref, toSipQuery } from '@/features/sips/search-params';
import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

/** Export: every SIP the list shows with these filters (all pages), as a CSV. The API audits it. */
export async function GET(request: NextRequest): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');
  const filters = parseSipFilters(Object.fromEntries(request.nextUrl.searchParams));
  try {
    const upstream = await apiDownload('/sips/export', { token, query: toSipQuery(filters, false) });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'text/csv; charset=utf-8',
        'content-disposition': upstream.headers.get('content-disposition') ?? 'attachment; filename="risips-sips.csv"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) return redirectTo('/auth/expired');
      if (error.code === 'MFA_REQUIRED') return redirectTo('/signin/mfa');
      return new NextResponse(`Export failed: ${error.message} Go back to ${sipsHref(filters)}.`, { status: error.status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    throw error;
  }
}
