import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import { signOut } from '@/features/auth/actions';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { MfaCodeForm } from '@/features/auth/components/mfa-code-form';
import { MfaSetup } from '@/features/auth/components/mfa-setup';
import type { StaffSessionState } from '@/types/admin-api.types';
import { safeNextPath } from '@/utils/safe-redirect';

export const metadata: Metadata = { title: 'Two-factor verification · RiSips Admin' };

type MfaPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps): Promise<React.JSX.Element> {
  const next = safeNextPath((await searchParams).next);
  const token = await readSessionToken();
  if (!token) redirect('/signin');

  let state: StaffSessionState;
  try {
    state = await apiRequest<StaffSessionState>('/sessions/current', { token });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) redirect('/auth/expired');
    throw error;
  }
  if (state.mfa === 'VERIFIED') redirect(state.mustChangePassword ? '/signin/password' : next);

  const enrolling = state.mfa === 'SETUP_REQUIRED';

  return (
    <AuthShell
      title={enrolling ? 'Set up two-factor sign-in' : 'Two-factor verification'}
      description={
        enrolling
          ? 'Staff accounts need an authenticator app. It takes a minute, once.'
          : 'Enter the code from your authenticator app.'
      }
    >
      {enrolling ? <MfaSetup next={next} /> : <MfaCodeForm next={next} />}

      <form action={signOut} className="mt-5">
        <button type="submit" className="text-[13px] font-medium text-ink-muted hover:text-ink">
          Use a different account
        </button>
      </form>
    </AuthShell>
  );
}
