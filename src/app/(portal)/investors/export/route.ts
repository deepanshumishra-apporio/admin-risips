import { NextResponse, type NextRequest } from 'next/server';

import { parseInvestorFilters, toFilterQuery, type InvestorFilters } from '@/features/investors/search-params';
import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

/** Why an export came back without a file, for the message on the list. */
export type ExportFailure = 'failed' | 'forbidden' | 'unavailable';

/**
 * The register report takes one stage and nothing else, so it can stand in for
 * the list's own export only when the view is all investors or one stage.
 * Anything narrower would download more people than the screen shows.
 */
function registerQuery(filters: InvestorFilters): Record<string, string> | null {
  const plain = !filters.q && !filters.kyc.length && !filters.stalled && filters.sipDue === null && !filters.attention;
  if (!plain || filters.stage.length > 1) return null;
  return filters.stage[0] ? { status: filters.stage[0] } : {};
}

function csv(upstream: Response): NextResponse {
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'text/csv; charset=utf-8',
      'content-disposition': upstream.headers.get('content-disposition') ?? 'attachment; filename="risips-investors.csv"',
      'cache-control': 'no-store',
    },
  });
}

/**
 * "Export list": the investors on screen, with the same filters, as a CSV. The
 * API checks the permission, masks contact details and writes the audit entry.
 *
 * An API from before the list had its own export answers 404; then the
 * investor register report is used instead, when it covers exactly this view.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');

  const filters = parseInvestorFilters(Object.fromEntries(request.nextUrl.searchParams));
  const query = toFilterQuery(filters);

  const back = (reason: ExportFailure): NextResponse => {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    params.set('exportFailed', reason);
    return redirectTo('/investors', params);
  };

  const session = (error: unknown): NextResponse | null => {
    if (!(error instanceof ApiError)) return null;
    if (error.isUnauthenticated) return redirectTo('/auth/expired');
    if (error.code === 'MFA_REQUIRED') return redirectTo('/signin/mfa');
    if (error.code === 'PASSWORD_CHANGE_REQUIRED') return redirectTo('/signin/password');
    return null;
  };

  try {
    return csv(
      await apiDownload('/investors/export', {
        token,
        query: {
          search: query.search,
          stage: query.stage,
          kycStatus: query.kycStatus,
          kycStalled: query.kycStalled ? 'true' : undefined,
          sipDueDays: query.sipDueDays,
          attention: query.attention,
        },
      }),
    );
  } catch (error) {
    const redirect = session(error);
    if (redirect) return redirect;
    if (!(error instanceof ApiError) || error.status !== 404) {
      console.error('[investors] export failed', error);
      return back(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'failed');
    }
  }

  // The API has no list export yet: fall back to the register report if it matches.
  const register = registerQuery(filters);
  if (!register) return back('unavailable');
  try {
    return csv(await apiDownload('/reports/investors/export', { token, query: register }));
  } catch (error) {
    const redirect = session(error);
    if (redirect) return redirect;
    console.error('[investors] register export failed', error);
    return back(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'failed');
  }
}
