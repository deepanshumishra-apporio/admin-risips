import { NextResponse, type NextRequest } from 'next/server';

import { apiDownload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The file types NSE takes for documents: the only ones shown in the browser. */
const ViewableTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']);

/**
 * Opens one uploaded document (AOF, FATCA form, cancelled cheque) exactly as it was sent to NSE, in the browser.
 * The API checks the permission, decrypts the stored copy and audits the opening.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }): Promise<Response> {
  const token = await readSessionToken();
  if (!token) return redirectTo('/signin');
  const { id, fileId } = await params;
  if (!Uuid.test(id) || !/^[A-Za-z0-9_-]{8,64}$/.test(fileId)) return new NextResponse('Not found', { status: 404 });
  try {
    const upstream = await apiDownload(`/hufs/${id}/documents/${encodeURIComponent(fileId)}`, { token });
    // Opened in the browser only as one of the types NSE accepts. Anything else (an HTML or SVG file, whatever the
    // stored type says) is downloaded instead, so a document can never run as a page on the admin's own address.
    const type = (upstream.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
    const viewable = ViewableTypes.has(type);
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'content-type': viewable ? type : 'application/octet-stream',
        'content-disposition': viewable ? (upstream.headers.get('content-disposition') ?? 'inline') : 'attachment',
        'x-content-type-options': 'nosniff',
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
