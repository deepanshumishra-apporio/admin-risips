import type { JourneyStage } from '@/types/admin-api.types';

/**
 * The journey in five steps. The API tracks seven stages; the three between
 * "KYC done" and "ready" are one step to the investor and to whoever is
 * helping them, so they are shown together.
 */
export type Bucket = {
  key: string;
  label: string;
  stages: JourneyStage[];
  /** Darkest blue for the earliest step, lightest for the furthest. */
  color: string;
};

export const Buckets: readonly Bucket[] = [
  { key: 'signed-up', label: 'Signed up only', stages: ['SIGNED_UP'], color: '#1f5aa8' },
  { key: 'kyc', label: 'KYC in progress', stages: ['KYC'], color: '#2a6cc4' },
  { key: 'not-ready', label: 'KYC done, not ready', stages: ['KYC_COMPLETED', 'PROFILE', 'ACCOUNT_SETUP'], color: '#3584e4' },
  { key: 'ready', label: 'Ready to invest', stages: ['READY_TO_INVEST'], color: '#6aa7f0' },
  { key: 'invested', label: 'Invested', stages: ['INVESTED'], color: '#a9cdf7' },
];

/** Which of the five steps a stage belongs to, 1 to 5 — the list's progress bar. */
export function stepOf(stage: JourneyStage): number {
  return Buckets.findIndex((bucket) => bucket.stages.includes(stage)) + 1;
}
