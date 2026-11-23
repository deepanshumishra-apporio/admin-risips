import { redirect } from 'next/navigation';

/** The breadcrumb links here; HUF onboarding is the first of the two onboarding screens (HUFs, companies). */
export default function OnboardingPage(): never {
  redirect('/onboarding/hufs');
}
