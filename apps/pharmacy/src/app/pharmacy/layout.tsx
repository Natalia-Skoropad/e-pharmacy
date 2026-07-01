import type { Metadata } from 'next';

import { PharmacyShell } from '@/components/layout/PharmacyShell/PharmacyShell';

//===================================================================

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

//===================================================================

type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <PharmacyShell>{children}</PharmacyShell>;
}

export default ProtectedLayout;
