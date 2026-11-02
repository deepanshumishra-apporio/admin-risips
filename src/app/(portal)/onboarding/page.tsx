import { redirect } from 'next/navigation';

/** The breadcrumb links here; HUFs are the only onboarding staff do from the admin. */
export default function OnboardingPage(): never {
  redirect('/onboarding/hufs');
}
