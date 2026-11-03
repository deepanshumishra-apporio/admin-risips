'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { HufConsentView, HufDetail, HufDetailsInput } from '@/types/admin-api.types';

/**
 * `values` and `attempt` come back with an error: React resets a form after its action, so the form is redrawn
 * from what was submitted rather than losing everything typed.
 */
export type HufFormState = { error: string | null; fields?: Record<string, string>; values?: HufDetailsInput & { accountNoConfirm: string }; attempt?: number };
export type HufActionState = { error: string | null; done?: string | null; consentUrl?: string | null };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/** The form's flat names (karta.name, coparceners.0.name) back into the API's shape. */
function readForm(form: FormData): HufDetailsInput & { accountNoConfirm: string } {
  const coparceners: HufDetailsInput['coparceners'] = [];
  for (let i = 0; i < 30; i += 1) {
    const name = text(form, `coparceners.${i}.name`);
    const relationship = text(form, `coparceners.${i}.relationship`);
    if (!name && !relationship) continue;
    coparceners.push({ name, relationship, dateOfBirth: text(form, `coparceners.${i}.dateOfBirth`) || null });
  }
  return {
    clientCode: text(form, 'clientCode'),
    hufName: text(form, 'hufName'),
    pan: text(form, 'pan'),
    formedOn: text(form, 'formedOn'),
    placeOfFormation: text(form, 'placeOfFormation'),
    natureOfBusiness: text(form, 'natureOfBusiness'),
    incomeSlab: text(form, 'incomeSlab'),
    netWorthLakhs: text(form, 'netWorthLakhs'),
    netWorthDate: text(form, 'netWorthDate'),
    email: text(form, 'email'),
    mobile: text(form, 'mobile'),
    accountType: text(form, 'accountType') === 'CB' ? 'CB' : 'SB',
    accountNo: text(form, 'accountNo'),
    accountNoConfirm: text(form, 'accountNoConfirm'),
    ifsc: text(form, 'ifsc'),
    bankHolderName: text(form, 'bankHolderName'),
    address1: text(form, 'address1'),
    address2: text(form, 'address2'),
    address3: text(form, 'address3'),
    city: text(form, 'city'),
    state: text(form, 'state'),
    pincode: text(form, 'pincode'),
    karta: {
      name: text(form, 'karta.name'),
      pan: text(form, 'karta.pan'),
      dateOfBirth: text(form, 'karta.dateOfBirth'),
      gender: (['M', 'F', 'O'].includes(text(form, 'karta.gender')) ? text(form, 'karta.gender') : '') as 'M',
      fatherName: text(form, 'karta.fatherName'),
    },
    coparceners,
  };
}

/**
 * API errors become a message (and field messages). Anything else is rethrown,
 * including the redirects `authedRequest` raises for an expired session.
 */
function failure(error: unknown): HufFormState {
  if (error instanceof ApiError) {
    const fields = error.details['fields'];
    return fields && typeof fields === 'object' ? { error: error.message, fields: fields as Record<string, string> } : { error: error.message };
  }
  throw error;
}

export async function saveHuf(_previous: HufFormState, form: FormData): Promise<HufFormState> {
  const id = text(form, 'id');
  if (id && !Uuid.test(id)) return { error: 'That HUF could not be found.' };
  const values = readForm(form);
  let saved: HufDetail;
  try {
    saved = await authedRequest<HufDetail>(id ? `/hufs/${id}` : '/hufs', { method: id ? 'PUT' : 'POST', body: values });
  } catch (error) {
    return { ...failure(error), values, attempt: Date.now() };
  }
  revalidatePath('/onboarding/hufs');
  redirect(`/onboarding/hufs/${saved.id}`);
}

/** Runs one action on a HUF and refreshes its page. */
async function act(form: FormData, path: string, done: string, body?: unknown): Promise<HufActionState> {
  const id = text(form, 'id');
  if (!Uuid.test(id)) return { error: 'That HUF could not be found.' };
  try {
    await authedRequest(`/hufs/${id}/${path}`, { method: 'POST', ...(body !== undefined && { body }) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/onboarding/hufs/${id}`);
  revalidatePath('/onboarding/hufs');
  return { error: null, done };
}

/** A fresh consent link, built on the address staff reached this dashboard on. Shown once: only its hash is kept. */
export async function createConsentLink(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const id = text(form, 'id');
  if (!Uuid.test(id)) return { error: 'That HUF could not be found.' };
  let token: string;
  try {
    ({ token } = await authedRequest<{ token: string; expiresAt: string }>(`/hufs/${id}/consent-link`, { method: 'POST' }));
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  const incoming = await headers();
  const host = incoming.get('x-forwarded-host') ?? incoming.get('host') ?? 'localhost:3100';
  const proto = incoming.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  revalidatePath(`/onboarding/hufs/${id}`);
  return { error: null, done: 'Link created. Send it to the karta.', consentUrl: `${proto}://${host}/huf-consent/${token}` };
}

export async function approveHuf(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  return act(form, 'approve', 'Sent to NSE.', { allowNewClientCode: form.get('allowNewClientCode') === 'on' });
}

export async function refreshHuf(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  return act(form, 'refresh', 'Read from NSE just now.');
}

export async function resendHufLink(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  return act(form, 'resend-link', "NSE has re-sent the link to the karta's email and mobile.");
}

export async function markHufActive(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const note = text(form, 'note');
  if (!note) return { error: 'Say how you know the karta has authorised it, e.g. an accepted order number.' };
  return act(form, 'mark-active', 'Marked active.', { note });
}

export async function cancelHuf(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  return act(form, 'cancel', 'Cancelled.');
}

/** NSE accepts these; the API checks the file really is one. */
const DocumentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']);
const MaxDocumentBytes = 3 * 1024 * 1024;

/** A signed document (AOF, FATCA form, cancelled cheque), passed to NSE through the API. It isn't kept here. */
export async function uploadHufDocument(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const id = text(form, 'id');
  const kind = text(form, 'kind');
  const file = form.get('file');
  if (!Uuid.test(id)) return { error: 'That HUF could not be found.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose the scanned file first.' };
  if (!DocumentTypes.has(file.type)) return { error: 'Upload a PDF, JPG, PNG or TIFF.' };
  if (file.size > MaxDocumentBytes) return { error: 'The file is over 3 MB. Scan it at a lower resolution, or as a PDF.' };
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  return act(form, 'documents', 'Sent to NSE.', { kind, contentType: file.type, data });
}

// --- the karta's consent page (no staff session) -----------------------------------------

export type ConsentState = { error: string | null; view?: HufConsentView };

export async function giveConsent(_previous: ConsentState, form: FormData): Promise<ConsentState> {
  const token = text(form, 'token');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { error: 'This link is not valid.' };
  if (form.get('agree') !== 'on') return { error: 'Tick the box to agree.' };
  try {
    // apiRequest forwards the karta's own IP and browser, which the API records as the consent evidence.
    const view = await apiRequest<HufConsentView>(`/public/huf-consent/${encodeURIComponent(token)}`, { method: 'POST', body: { agree: true } });
    return { error: null, view };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
