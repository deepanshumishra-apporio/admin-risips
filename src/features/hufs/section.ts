import { headers } from 'next/headers';

import type { EntityType } from '@/types/admin-api.types';

/**
 * HUFs and companies have their own sidebar items and screens: /onboarding/hufs and /onboarding/companies. Both are
 * served by the same pages (each /onboarding/companies page re-exports its HUF twin, and the middleware says which section it is in
 * the `x-client-section` header), so each page builds its links and filters from the section it was opened in.
 */
export type ClientSection = {
  type: EntityType;
  /** "/onboarding/hufs" or "/onboarding/companies": every link in the section starts here. */
  base: string;
  /** "HUF onboarding" or "Company onboarding": the sidebar item and the back links. */
  title: string;
  /** "HUF" or "company", for sentences. */
  word: string;
};

export const SectionHeader = 'x-client-section';

export const sectionFor = (type: EntityType | undefined): ClientSection =>
  type === 'COMPANY'
    ? { type: 'COMPANY', base: '/onboarding/companies', title: 'Company onboarding', word: 'company' }
    : { type: 'HUF', base: '/onboarding/hufs', title: 'HUF onboarding', word: 'HUF' };

/** The section the current page was opened in. */
export async function currentSection(): Promise<ClientSection> {
  return sectionFor((await headers()).get(SectionHeader) === 'companies' ? 'COMPANY' : 'HUF');
}
