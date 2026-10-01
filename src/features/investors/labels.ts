import type { JourneyStage, KycNextStep, KycStatus } from '@/types/admin-api.types';

export const StageLabel: Record<JourneyStage, string> = {
  SIGNED_UP: 'Signed up',
  KYC: 'KYC pending',
  KYC_COMPLETED: 'KYC completed',
  PROFILE: 'Profile created',
  ACCOUNT_SETUP: 'Account setup',
  READY_TO_INVEST: 'Ready to invest',
  INVESTED: 'Invested',
};

export const KycLabel: Record<KycStatus, string> = {
  NOT_STARTED: 'Not started',
  PAN_CHECK_FAILED: 'PAN check not passed',
  IN_PROGRESS: 'In progress',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
};

export const NextStepLabel: Record<KycNextStep, string> = {
  PROVIDE_DETAILS: 'Filling in details',
  FETCH_PROOF: 'Aadhaar via DigiLocker',
  UPLOAD_SIGNATURE: 'Uploading signature',
  ESIGN: 'Aadhaar e-Sign',
  WAITING_ON_PROVIDER: 'Waiting on the KRA',
};

export const StageOptions = (Object.keys(StageLabel) as JourneyStage[]).map((value) => ({ value, label: StageLabel[value] }));
export const KycOptions = (Object.keys(KycLabel) as KycStatus[]).map((value) => ({ value, label: KycLabel[value] }));
