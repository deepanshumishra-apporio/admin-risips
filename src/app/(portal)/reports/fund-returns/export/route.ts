import { NextResponse, type NextRequest } from 'next/server';

import { fundReturnsParams } from '@/features/reports/fund-returns';
import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

/**
 * Streams the fund returns report as Excel or PDF from the API, the session cookie turned into the bearer token like
 * every other call. The API checks the permission and writes the audit entry.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');

  const params = fundReturnsParams(Object.fromEntries(request.nextUrl.searchParams));
  const format = request.nextUrl.searchParams.get('format') === 'pdf' ? 'pdf' : 'xlsx';
  try {
    const upstream = await apiDownload('/reports/fund-returns/export', { token, query: { ...params, format } });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
        'content-disposition': upstream.headers.get('content-disposition') ?? `attachment; filename="risips-fund-returns.${format}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) return redirectTo('/auth/expired');
      if (error.code === 'MFA_REQUIRED') return redirectTo('/signin/mfa');
      if (error.code === 'PASSWORD_CHANGE_REQUIRED') return redirectTo('/signin/password');
    }
    console.error('[reports] fund returns export failed', error);
    return redirectTo('/reports/fund-returns', { ...params, failed: '1' });
  }
}
