'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { sectionFor } from '@/features/hufs/section';
import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { CompanyOwner, HufConsentView, HufDetail, HufDetailsInput } from '@/types/admin-api.types';

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

/** NSE takes at most 4 owners; one more row is read so the API can say so rather than drop it. */
const OwnerRows = 5;

/** The form's flat names (karta.name, coparceners.0.name, owners.0.pan) back into the API's shape. */
function readForm(form: FormData): HufDetailsInput & { accountNoConfirm: string } {
  const company = text(form, 'entityType') === 'COMPANY';
  const owners: CompanyOwner[] = [];
  for (let i = 0; company && i < OwnerRows; i += 1) {
    const name = text(form, `owners.${i}.name`);
    const pan = text(form, `owners.${i}.pan`);
    if (!name && !pan) continue;
    owners.push({
      name, pan,
      dateOfBirth: text(form, `owners.${i}.dateOfBirth`),
      gender: (['M', 'F', 'O'].includes(text(form, `owners.${i}.gender`)) ? text(form, `owners.${i}.gender`) : '') as 'M',
      fatherName: text(form, `owners.${i}.fatherName`),
      category: text(form, `owners.${i}.category`) === 'SMO' ? 'SMO' : 'UBO',
      holdingPct: text(form, `owners.${i}.holdingPct`),
      designation: text(form, `owners.${i}.designation`),
    });
  }
  const listed = company && form.get('listed.on') === 'on'
    ? { exchange: (text(form, 'listed.exchange') === 'B' ? 'B' : 'N') as 'B' | 'N', isin: text(form, 'listed.isin') }
    : null;
  const coparceners: HufDetailsInput['coparceners'] = [];
  for (let i = 0; !company && i < 30; i += 1) {
    const name = text(form, `coparceners.${i}.name`);
    const relationship = text(form, `coparceners.${i}.relationship`);
    if (!name && !relationship) continue;
    coparceners.push({ name, relationship, dateOfBirth: text(form, `coparceners.${i}.dateOfBirth`) || null });
  }
  return {
    entityType: company ? 'COMPANY' : 'HUF',
    ...(company && { signatoryDesignation: text(form, 'signatoryDesignation'), cin: text(form, 'cin'), owners: listed ? [] : owners, listed }),
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
    accountType: company || text(form, 'accountType') === 'CB' ? 'CB' : 'SB',
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
  if (id && !Uuid.test(id)) return { error: 'That client could not be found.' };
  const values = readForm(form);
  let saved: HufDetail;
  try {
    saved = await authedRequest<HufDetail>(id ? `/hufs/${id}` : '/hufs', { method: id ? 'PUT' : 'POST', body: values });
  } catch (error) {
    return { ...failure(error), values, attempt: Date.now() };
  }
  // HUFs and companies have their own screens (both served by the /onboarding/hufs pages).
  revalidatePath('/onboarding/hufs', 'layout');
  redirect(`${sectionFor(saved.entityType).base}/${saved.id}`);
}

/** Runs one action on a HUF and refreshes its page. */
async function act(form: FormData, path: string, done: string, body?: unknown): Promise<HufActionState> {
  const id = text(form, 'id');
  if (!Uuid.test(id)) return { error: 'That client could not be found.' };
  try {
    await authedRequest(`/hufs/${id}/${path}`, { method: 'POST', ...(body !== undefined && { body }) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath('/onboarding/hufs', 'layout');
  return { error: null, done };
}

/** A fresh consent link, built on the address staff reached this dashboard on. Shown once: only its hash is kept. */
export async function createConsentLink(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const id = text(form, 'id');
  if (!Uuid.test(id)) return { error: 'That client could not be found.' };
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
  return act(form, 'resend-link', 'NSE has re-sent the link to the registered email and mobile.');
}

export async function markHufActive(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const note = text(form, 'note');
  if (!note) return { error: 'Say how you know NSE has activated it, e.g. an accepted order number.' };
  return act(form, 'mark-active', 'Marked active.', { note });
}

export async function cancelHuf(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  return act(form, 'cancel', 'Cancelled.');
}

/** Adds HUFs registered on NSE directly (e.g. on its portal), so every HUF on NSE shows here. */
export async function syncHufsFromNse(_previous: HufActionState): Promise<HufActionState> {
  try {
    const { found, imported } = await authedRequest<{ found: number; imported: string[] }>('/hufs/sync', { method: 'POST' });
    revalidatePath('/onboarding/hufs');
    return {
      error: null,
      done: imported.length ? `Added ${imported.join(', ')} from NSE (${found} HUFs and companies on NSE).` : `All ${found} HUFs and companies on NSE are already here.`,
    };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

/** NSE accepts these; the API checks the file really is one. */
const DocumentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']);
const MaxDocumentBytes = 3 * 1024 * 1024;

/** A signed document (AOF, FATCA form, cancelled cheque), passed to NSE through the API. It isn't kept here. */
export async function uploadHufDocument(_previous: HufActionState, form: FormData): Promise<HufActionState> {
  const id = text(form, 'id');
  const kind = text(form, 'kind');
  const file = form.get('file');
  if (!Uuid.test(id)) return { error: 'That client could not be found.' };
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
