import { redirect } from 'next/navigation';

import { landingFor } from '@/lib/auth/landing';
import { currentStaff } from '@/lib/auth/session';

/**
 * Home, for a bookmark or the logo. Sign-in no longer comes through here — it
 * goes straight to the landing page — because each hop through `/` cost a
 * second `/me` call and a render before the real page could start.
 */
export default async function HomePage(): Promise<never> {
  const { permissions } = await currentStaff();
  redirect(landingFor(permissions));
}
