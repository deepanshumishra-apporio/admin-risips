import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { parseTheme, ThemeCookie } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  title: 'RiSips Admin Portal',
  description: 'Centralised control, compliance oversight and operational visibility for RiSips MFD.',
};

export default async function RootLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  // An explicit choice goes on <html>; "system" leaves it off and the CSS follows the OS.
  const theme = parseTheme((await cookies()).get(ThemeCookie)?.value);

  return (
    <html lang="en" data-theme={theme === 'system' ? undefined : theme} suppressHydrationWarning>
      {/* Browser extensions (ColorZilla, Grammarly, password managers) add attributes to <body>
          before React loads. Ignoring them here covers only <body>'s own attributes, not the page.
          <html> carries the same flag because the theme switcher changes data-theme in place. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
