'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';

export type InvestState = { error: string | null; done?: string | null; link?: string | null };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

type View = { requests: { link: string | null; linkError: string | null; nseId: string | null }[] };

/** One call; the newest request's link comes back so the person who placed it can send it to the karta. */
async function send(form: FormData, path: string, body: unknown, done: string): Promise<InvestState> {
  const id = text(form, 'id');
  if (!Uuid.test(id)) return { error: 'That client could not be found.' };
  let view: View;
  try {
    view = await authedRequest<View>(`/hufs/${id}/${path}`, { method: 'POST', ...(body !== undefined && { body }) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  // The HUF's page and everything under it: portfolio, funds, invest steps, mandate.
  revalidatePath(`/onboarding/hufs/${id}`, 'layout');
  const latest = view.requests[0];
  return { error: null, done: latest?.nseId ? `${done} NSE reference ${latest.nseId}.` : done, link: latest?.link ?? null };
}

export async function placePurchase(_previous: InvestState, form: FormData): Promise<InvestState> {
  if (form.get('confirm') !== 'on') return { error: 'Tick the box to confirm the order.' };
  return send(form, 'purchase', { schemeCode: text(form, 'schemeCode'), amount: Number(text(form, 'amount')), folio: text(form, 'folio') || null },
    'Order placed. The karta or signatory confirms it on NSE, then pays (or pay by NEFT and enter the UTR here).');
}

export async function registerMandate(_previous: InvestState, form: FormData): Promise<InvestState> {
  return send(form, 'mandate', { amount: Number(text(form, 'amount')) }, 'Mandate registered. The karta or signatory approves it with their bank.');
}

export async function registerSip(_previous: InvestState, form: FormData): Promise<InvestState> {
  if (form.get('confirm') !== 'on') return { error: 'Tick the box to confirm the SIP.' };
  return send(form, 'sip', {
    schemeCode: text(form, 'schemeCode'), amount: Number(text(form, 'amount')), startDate: text(form, 'startDate'),
    installments: Number(text(form, 'installments')), mandateId: text(form, 'mandateId'),
  }, 'SIP registered. The karta or signatory approves it on NSE.');
}

/** Sells from a folio: an amount, a number of units, or all units. The investor authorises it on NSE (RED link). */
export async function placeRedemption(_previous: InvestState, form: FormData): Promise<InvestState> {
  if (form.get('confirm') !== 'on') return { error: 'Tick the box to confirm the redemption.' };
  const by = text(form, 'by');
  const all = by === 'all';
  return send(form, 'redeem', {
    schemeCode: text(form, 'schemeCode'), folio: text(form, 'folio'), all,
    by: by === 'units' ? 'units' : 'amount',
    ...(!all && by === 'units' && { units: Number(text(form, 'value')) }),
    ...(!all && by !== 'units' && { amount: Number(text(form, 'value')) }),
  }, 'Redemption placed. The karta or signatory authorises it on NSE; the money goes to the registered bank account.');
}

/** Stops a SIP with one of NSE's reasons. The investor authorises the cancellation on NSE (XSIP_CAN link). */
export async function cancelSip(_previous: InvestState, form: FormData): Promise<InvestState> {
  const regNo = text(form, 'regNo');
  if (!/^\d{1,20}$/.test(regNo)) return { error: 'That SIP could not be found.' };
  if (form.get('confirm') !== 'on') return { error: 'Tick the box to confirm stopping the SIP.' };
  return send(form, `sips/${regNo}/cancel`, { reason: text(form, 'reason'), other: text(form, 'other') },
    'Cancellation sent. The karta or signatory authorises it on NSE.');
}

export async function refreshInvestments(_previous: InvestState, form: FormData): Promise<InvestState> {
  return send(form, 'investments/refresh', undefined, 'Read from NSE just now.');
}

/** A placed purchase paid by NEFT/RTGS: the UTR of the transfer from the investor's registered account goes to NSE. */
export async function payByNeft(_previous: InvestState, form: FormData): Promise<InvestState> {
  const requestId = text(form, 'requestId');
  if (!/^[A-Z0-9]{4,20}$/.test(requestId)) return { error: 'That order could not be found.' };
  const utr = text(form, 'utr').toUpperCase();
  if (!/^[A-Z0-9]{12,30}$/.test(utr)) return { error: 'Enter the UTR from the bank: 12 to 30 letters and digits (NEFT 16, RTGS 22).' };
  return send(form, `requests/${requestId}/neft`, { utr }, 'UTR sent to NSE.');
}

export async function refreshRequestLink(_previous: InvestState, form: FormData): Promise<InvestState> {
  const requestId = text(form, 'requestId');
  if (!/^[A-Z0-9]{4,20}$/.test(requestId)) return { error: 'That request could not be found.' };
  return send(form, `requests/${requestId}/link`, undefined, 'Link fetched again.');
}
