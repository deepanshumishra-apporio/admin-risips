import type { BadgeTone } from '@/components/ui/badge';
import type { HufInvestments } from '@/types/admin-api.types';

/** ₹1,23,456 (Indian grouping); a dash when unknown. */
export function inr(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export const unitsText = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 4 });

export type Fund = {
  schemeCode: string;
  schemeName: string;
  units: number;
  invested: number;
  value: number | null;
  gain: number | null;
  gainPercent: number | null;
  nav: number | null;
  navDate: string | null;
  folios: string[];
  orders: number;
  /** The newest order's NSE status, for a fund with no units yet. */
  lastOrder: { remark: string; status: string; date: string | null } | null;
};

/**
 * The HUF's funds: every scheme it holds units in (across folios) and every scheme it has ordered, even when
 * nothing was allotted (a failed or pending order still belongs on the fund's screen).
 */
export function fundsOf(inv: HufInvestments): Fund[] {
  const funds = new Map<string, Fund>();
  const get = (code: string, name: string): Fund => {
    const existing = funds.get(code);
    if (existing) return existing;
    const fresh: Fund = { schemeCode: code, schemeName: name, units: 0, invested: 0, value: null, gain: null, gainPercent: null, nav: null, navDate: null, folios: [], orders: 0, lastOrder: null };
    funds.set(code, fresh);
    return fresh;
  };
  for (const h of inv.holdings) {
    const f = get(h.schemeCode, h.schemeName);
    f.units += h.units;
    f.invested += h.invested;
    f.value = h.value === null ? f.value : (f.value ?? 0) + h.value;
    f.nav = h.nav ?? f.nav;
    f.navDate = h.navDate ?? f.navDate;
    if (h.folio && !f.folios.includes(h.folio)) f.folios.push(h.folio);
  }
  for (const o of inv.orders) {
    const f = get(o.schemeCode, o.schemeName);
    f.orders += 1;
    f.lastOrder ??= { remark: o.remark, status: o.status, date: o.date };
    if (o.folio && !f.folios.includes(o.folio)) f.folios.push(o.folio);
  }
  for (const f of funds.values()) {
    if (f.value !== null) {
      f.gain = f.value - f.invested;
      f.gainPercent = f.invested ? (f.gain / f.invested) * 100 : null;
    }
  }
  return [...funds.values()].sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || b.orders - a.orders);
}

/** What kind of order it was, in words. */
export function orderKind(o: HufInvestments['orders'][number]): string {
  if (o.type === 'REDEMPTION') return 'Redemption';
  return o.orderType === 'XSP' || o.sipRegistrationNo ? 'SIP instalment' : 'Purchase';
}

/** An order's NSE remark, toned by where it ended up. */
export function orderTone(status: string, remark: string): BadgeTone {
  if (/ALLOTMENT DONE|UNITS TRANSFERRED/.test(remark)) return 'success';
  if (/INVALID|FAIL|REJECT|NOT SUBMITTED/.test(`${status} ${remark}`)) return 'danger';
  return 'warn';
}

export const planTone = (s: string): BadgeTone => (/APPROVED|ACTIVE|LIVE/.test(s) ? 'success' : /REJECT|CXL|CANCEL|FAIL/.test(s) ? 'danger' : 'warn');

/** "ALLOTMENT DONE" -> "Allotment done". */
export const sentence = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);
