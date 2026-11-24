import { NextResponse, type NextRequest } from 'next/server';

import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Download receipt: a one-page PDF of the transaction, to send to the investor. The API audits it. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');
  const { id } = await params;
  if (!Uuid.test(id)) return new NextResponse('Not found', { status: 404 });
  try {
    const upstream = await apiDownload(`/transactions/${id}/receipt`, { token });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': upstream.headers.get('content-disposition') ?? 'attachment; filename="risips-receipt.pdf"',
        'cache-control': 'no-store, private',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) return redirectTo('/auth/expired');
      if (error.code === 'MFA_REQUIRED') return redirectTo('/signin/mfa');
      return new NextResponse(error.message, { status: error.status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    throw error;
  }
}
