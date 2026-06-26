import type { Metadata } from 'next';

import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';

import { ToastProvider } from '@e-pharmacy/ui/feedback';

import { AuthProvider } from '@/providers/AuthProvider';

import './styles.css';

//===================================================================

export const metadata: Metadata = {
  title: {
    default: 'Pharmacy Cabinet | E-PHARMACY',
    template: '%s | Pharmacy Cabinet',
  },
  description: 'Private pharmacy cabinet for E-PHARMACY partners.',
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
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

export default RootLayout;
