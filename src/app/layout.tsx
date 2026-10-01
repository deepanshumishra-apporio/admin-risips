import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'RiSips Admin Portal',
  description: 'Centralised control, compliance oversight and operational visibility for RiSips MFD.',
};

export default function RootLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      {/* Browser extensions (ColorZilla, Grammarly, password managers) add attributes to <body>
          before React loads. Ignoring them here covers only <body>'s own attributes, not the page. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
