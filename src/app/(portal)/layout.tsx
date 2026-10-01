import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/layout/sidebar-state';
import { Topbar } from '@/components/layout/topbar';
import { currentStaff } from '@/lib/auth/session';

/**
 * Authenticated pages are never prerendered: a build-time render has no
 * session, and a static copy would serve its sign-in redirect to everyone.
 */
export const dynamic = 'force-dynamic';

/** Every portal page renders inside this, so every page load re-checks the session with the API. */
export default async function PortalLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const staff = await currentStaff();
  const account = { name: staff.fullName, email: staff.email, role: staff.roles.map((role) => role.name).join(', ') || 'No role' };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface">
        <Topbar account={account} />

        <div className="flex">
          <Sidebar permissions={staff.permissions} />

          <div className="flex min-h-[calc(100vh-var(--shell-header))] min-w-0 flex-1 flex-col">
            <main className="flex-1 px-6 py-6">{children}</main>
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
