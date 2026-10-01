import type { Metadata } from 'next';

import { authedRequest } from '@/lib/auth/session';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import type { StaffMe } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Set a new password · RiSips Admin' };

export default async function ChangePasswordPage(): Promise<React.JSX.Element> {
  // Read directly rather than through `currentStaff`, which sends anyone who
  // must change their password here — and this page must not bounce to itself.
  const me = await authedRequest<StaffMe>('/me');

  return (
    <AuthShell
      title={me.mustChangePassword ? 'Set a new password' : 'Change your password'}
      description={
        me.mustChangePassword
          ? 'Your password was issued by an administrator. Choose your own before continuing.'
          : 'Other devices signed in to your account will be signed out.'
      }
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
