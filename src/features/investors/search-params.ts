import {
  InvestorAttentions,
  JourneyStages,
  KycStatuses,
  type InvestorAttention,
  type InvestorListQuery,
  type JourneyStage,
  type KycStatus,
} from '@/types/admin-api.types';

/** The investor list's filters, as they appear in the URL. The URL is the state: shareable and back-button safe. */
export type InvestorFilters = {
  q: string;
  stage: JourneyStage[];
  kyc: KycStatus[];
  stalled: boolean;
  /** Only investors with an active SIP due within this many days. */
  sipDue: number | null;
  /** Only the investors a stage card counts as needing attention. */
  attention: InvestorAttention | null;
  /** How many rows to show; "Load more" raises it. */
  show: number;
  cursor: string | null;
};

/** Rows per "Load more". */
export const PageStep = 25;
/** The most rows one page shows; past it the list moves on with a cursor. */
export const MaxShow = 100;

export const BlankFilters: InvestorFilters = {
  q: '', stage: [], kyc: [], stalled: false, sipDue: null, attention: null, show: PageStep, cursor: null,
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

/**
 * The last non-empty value: the filter form can send a field twice — a hidden
 * multi-stage view first, then the menu — and the menu's choice must win.
 */
const lastFilled = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? [...value].reverse().find((entry) => entry.trim() !== '') ?? '' : value ?? '';

function listOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  return lastFilled(value)
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry): entry is T => (allowed as readonly string[]).includes(entry));
}

/** Unknown values are dropped, never forwarded: the URL is user input. */
export function parseInvestorFilters(params: RawParams): InvestorFilters {
  const cursor = first(params['cursor']);
  const sipDue = Number(first(params['sipDue']));
  const show = Number(first(params['show']));
  const attention = first(params['attention']).toUpperCase();
  return {
    q: first(params['q']).trim().slice(0, 100),
    stage: listOf(params['stage'], JourneyStages),
    kyc: listOf(params['kyc'], KycStatuses),
    stalled: first(params['stalled']) === 'true',
    sipDue: first(params['sipDue']) !== '' && Number.isInteger(sipDue) && sipDue >= 0 && sipDue <= 60 ? sipDue : null,
    attention: (InvestorAttentions as readonly string[]).includes(attention) ? (attention as InvestorAttention) : null,
    show: Number.isInteger(show) && show >= PageStep && show <= MaxShow ? show : PageStep,
    cursor: /^[A-Za-z0-9_-]{1,200}$/.test(cursor) ? cursor : null,
  };
}

/** The filters without paging — what the export and the "Nudge" of a whole view act on. */
export function toFilterQuery(filters: InvestorFilters): Omit<InvestorListQuery, 'limit' | 'cursor'> {
  return {
    ...(filters.q && { search: filters.q }),
    ...(filters.stage.length && { stage: filters.stage }),
    ...(filters.kyc.length && { kycStatus: filters.kyc }),
    ...(filters.stalled && { kycStalled: true }),
    ...(filters.sipDue !== null && { sipDueDays: filters.sipDue }),
    ...(filters.attention && { attention: filters.attention }),
  };
}

export function toListQuery(filters: InvestorFilters): InvestorListQuery {
  return { ...toFilterQuery(filters), limit: filters.show, ...(filters.cursor && { cursor: filters.cursor }) };
}

function toParams(filters: InvestorFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.stage.length) params.set('stage', filters.stage.join(','));
  if (filters.kyc.length) params.set('kyc', filters.kyc.join(','));
  if (filters.stalled) params.set('stalled', 'true');
  if (filters.sipDue !== null) params.set('sipDue', String(filters.sipDue));
  if (filters.attention) params.set('attention', filters.attention);
  if (filters.show !== PageStep) params.set('show', String(filters.show));
  if (filters.cursor) params.set('cursor', filters.cursor);
  return params;
}

/**
 * A link to the list with some filters changed. Changing a filter returns to
 * the first rows; only "Load more" and the cursor keep the place.
 */
export function investorsHref(filters: InvestorFilters, change: Partial<InvestorFilters> = {}): string {
  const paging = 'show' in change || 'cursor' in change;
  const next = { ...filters, ...(paging ? {} : { show: PageStep, cursor: null }), ...change };
  const query = toParams(next).toString();
  return query ? `/investors?${query}` : '/investors';
}

/** The export download for the filters on screen. */
export function exportHref(filters: InvestorFilters): string {
  const query = toParams({ ...filters, show: PageStep, cursor: null }).toString();
  return query ? `/investors/export?${query}` : '/investors/export';
}

/** Two filter states pick the same investors (ignoring search and paging). */
export function sameView(a: InvestorFilters, b: InvestorFilters): boolean {
  const same = (x: readonly string[], y: readonly string[]) => x.length === y.length && x.every((value) => y.includes(value));
  return same(a.stage, b.stage) && same(a.kyc, b.kyc) && a.stalled === b.stalled && a.sipDue === b.sipDue && a.attention === b.attention;
}
