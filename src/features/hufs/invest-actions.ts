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
  if (!Uuid.test(id)) return { error: 'That HUF could not be found.' };
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
    'Order placed. The karta confirms it and pays on NSE.');
}

export async function registerMandate(_previous: InvestState, form: FormData): Promise<InvestState> {
  return send(form, 'mandate', { amount: Number(text(form, 'amount')) }, 'Mandate registered. The karta approves it with their bank.');
}

export async function registerSip(_previous: InvestState, form: FormData): Promise<InvestState> {
  if (form.get('confirm') !== 'on') return { error: 'Tick the box to confirm the SIP.' };
  return send(form, 'sip', {
    schemeCode: text(form, 'schemeCode'), amount: Number(text(form, 'amount')), startDate: text(form, 'startDate'),
    installments: Number(text(form, 'installments')), mandateId: text(form, 'mandateId'),
  }, 'SIP registered. The karta approves it on NSE.');
}

export async function refreshInvestments(_previous: InvestState, form: FormData): Promise<InvestState> {
  return send(form, 'investments/refresh', undefined, 'Read from NSE just now.');
}

export async function refreshRequestLink(_previous: InvestState, form: FormData): Promise<InvestState> {
  const requestId = text(form, 'requestId');
  if (!/^[A-Z0-9]{4,20}$/.test(requestId)) return { error: 'That request could not be found.' };
  return send(form, `requests/${requestId}/link`, undefined, 'Link fetched again.');
}
