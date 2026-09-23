import type { Metadata } from 'next';

import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';

import { AdminProviders } from '@/providers';

import './styles.css';

//===================================================================

export const metadata: Metadata = {
  title: {
    default: 'Admin Cabinet | E-PHARMACY',
    template: '%s | Admin Cabinet',
  },

  description: 'Private administration cabinet for E-PHARMACY.',

  robots: {
    index: false,
    follow: false,
  },
};

//===================================================================

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}

export default RootLayout;
