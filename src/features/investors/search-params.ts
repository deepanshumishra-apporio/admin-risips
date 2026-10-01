import { JourneyStages, KycStatuses, type InvestorListQuery, type JourneyStage, type KycStatus } from '@/types/admin-api.types';

/** The investor list's filters, as they appear in the URL. The URL is the state: shareable and back-button safe. */
export type InvestorFilters = {
  q: string;
  stage: JourneyStage[];
  kyc: KycStatus[];
  stalled: boolean;
  /** Only investors with an active SIP due within this many days. */
  sipDue: number | null;
  cursor: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

function listOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  return first(value)
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry): entry is T => (allowed as readonly string[]).includes(entry));
}

/** Unknown values are dropped, never forwarded: the URL is user input. */
export function parseInvestorFilters(params: RawParams): InvestorFilters {
  const cursor = first(params['cursor']);
  const sipDue = Number(first(params['sipDue']));
  return {
    q: first(params['q']).trim().slice(0, 100),
    stage: listOf(params['stage'], JourneyStages),
    kyc: listOf(params['kyc'], KycStatuses),
    stalled: first(params['stalled']) === 'true',
    sipDue: first(params['sipDue']) !== '' && Number.isInteger(sipDue) && sipDue >= 0 && sipDue <= 60 ? sipDue : null,
    cursor: /^[A-Za-z0-9_-]{1,200}$/.test(cursor) ? cursor : null,
  };
}

export function toListQuery(filters: InvestorFilters, limit: number): InvestorListQuery {
  return {
    limit,
    ...(filters.q && { search: filters.q }),
    ...(filters.stage.length && { stage: filters.stage }),
    ...(filters.kyc.length && { kycStatus: filters.kyc }),
    ...(filters.stalled && { kycStalled: true }),
    ...(filters.sipDue !== null && { sipDueDays: filters.sipDue }),
    ...(filters.cursor && { cursor: filters.cursor }),
  };
}

/** A link to the list with some filters changed. Changing a filter always returns to the first page. */
export function investorsHref(filters: InvestorFilters, change: Partial<InvestorFilters> = {}): string {
  const next = { ...filters, cursor: null, ...change };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.stage.length) params.set('stage', next.stage.join(','));
  if (next.kyc.length) params.set('kyc', next.kyc.join(','));
  if (next.stalled) params.set('stalled', 'true');
  if (next.sipDue !== null) params.set('sipDue', String(next.sipDue));
  if (next.cursor) params.set('cursor', next.cursor);
  const query = params.toString();
  return query ? `/investors?${query}` : '/investors';
}
