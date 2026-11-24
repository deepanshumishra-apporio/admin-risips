import { NextResponse, type NextRequest } from 'next/server';

import { parseTransactionFilters, toTransactionQuery } from '@/features/transactions/search-params';
import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

const Formats = ['csv', 'xlsx', 'pdf'];
const Ranges = ['current', 'today', 'last7', 'last30', 'thisMonth', 'fy', 'all'];

/** Export: the transactions the list's filters match, as CSV, Excel or PDF, streamed from the API (which audits it). */
export async function GET(request: NextRequest): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');
  const params = request.nextUrl.searchParams;
  const query = toTransactionQuery(parseTransactionFilters(Object.fromEntries(params)), 1);
  const pick = (name: string, allowed: string[], fallback: string) => (allowed.includes(params.get(name) ?? '') ? params.get(name)! : fallback);
  try {
    const upstream = await apiDownload('/transactions/export', {
      token,
      query: {
        type: query.type,
        state: query.state,
        flag: query.flag,
        attention: query.attention ? 'true' : undefined,
        from: query.from,
        to: query.to,
        search: query.search,
        format: pick('format', Formats, 'csv'),
        range: pick('range', Ranges, 'current'),
        columns: pick('columns', ['all', 'summary'], 'all'),
      },
    });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
        'content-disposition': upstream.headers.get('content-disposition') ?? 'attachment; filename="risips-transactions"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) return redirectTo('/auth/expired');
      if (error.code === 'MFA_REQUIRED') return redirectTo('/signin/mfa');
      return new NextResponse(`Export failed: ${error.message}`, { status: error.status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    throw error;
  }
}
