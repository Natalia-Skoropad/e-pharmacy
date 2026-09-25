import type { ReactNode } from 'react';

import { AuthHeader } from '@e-pharmacy/ui/auth';

import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

type AdminAuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export default function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <>
      <AuthHeader
        logoHref={ADMIN_ROUTES.LOGIN}
        logoAriaLabel="E-PHARMACY admin login"
      />
      {children}
    </>
  );
}
