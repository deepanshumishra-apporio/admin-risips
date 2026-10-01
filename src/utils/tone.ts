import type { BadgeTone } from '@/components/ui/badge';
import type { JourneyStage, KycStatus as ApiKycStatus } from '@/types/admin-api.types';
import type { AgentFlag, AgentStatus } from '@/types/agent.types';
import type { AlertSeverity } from '@/types/compliance.types';
import type { KycStatus, SipHealth } from '@/types/investor.types';
import type { PortfolioStatus, RiskProfile } from '@/types/portfolio.types';

export const KycTone: Record<KycStatus, BadgeTone> = {
  Verified: 'success',
  Pending: 'warn',
  Rejected: 'danger',
  'Re-KYC Due': 'violet',
};

export const SipTone: Record<SipHealth, BadgeTone> = {
  Healthy: 'success',
  Delayed: 'warn',
  'Repeated Failure': 'danger',
  Paused: 'neutral',
};

export const AgentStatusTone: Record<AgentStatus, BadgeTone> = {
  Active: 'success',
  Suspended: 'danger',
  Onboarding: 'brand',
};

export const AgentFlagTone: Record<AgentFlag, BadgeTone> = {
  'Licence Expiring': 'warn',
  'KYC Backlog': 'violet',
  'SIP Failures': 'danger',
  Clean: 'success',
};

export const RiskTone: Record<RiskProfile, BadgeTone> = {
  Conservative: 'success',
  Moderate: 'brand',
  Aggressive: 'violet',
};

export const PortfolioStatusTone: Record<PortfolioStatus, BadgeTone> = {
  Live: 'success',
  Draft: 'warn',
};

export const SeverityTone: Record<AlertSeverity, BadgeTone> = {
  High: 'danger',
  Medium: 'warn',
  Low: 'neutral',
};

// --- Live admin API -----------------------------------------------------------

export const JourneyStageTone: Record<JourneyStage, BadgeTone> = {
  SIGNED_UP: 'neutral',
  KYC: 'warn',
  KYC_COMPLETED: 'brand',
  PROFILE: 'brand',
  ACCOUNT_SETUP: 'violet',
  READY_TO_INVEST: 'success',
  INVESTED: 'success',
};

export const KycStatusTone: Record<ApiKycStatus, BadgeTone> = {
  NOT_STARTED: 'neutral',
  PAN_CHECK_FAILED: 'danger',
  IN_PROGRESS: 'warn',
  FAILED: 'danger',
  EXPIRED: 'danger',
  COMPLETED: 'success',
};
