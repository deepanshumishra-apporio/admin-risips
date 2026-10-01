import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/auth-shell';
import { Notice } from '@/features/auth/components/form-parts';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { safeNextPath } from '@/utils/safe-redirect';

export const metadata: Metadata = { title: 'Sign in · RiSips Admin' };

const Reasons: Record<string, string> = {
  expired: 'Your session ended. Sign in again to continue.',
  mfa: 'Too many incorrect codes. Sign in again to get a new chance.',
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps): Promise<React.JSX.Element> {
  const { next, reason } = await searchParams;
  const notice = reason ? Reasons[reason] : undefined;

  return (
    <AuthShell title="Sign in" description="Use your RiSips staff account to continue.">
      <div className="space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        <SignInForm next={safeNextPath(next)} />
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          Forgot your password or lost your authenticator? A super admin can reset it for you.
        </p>
      </div>
    </AuthShell>
  );
}
