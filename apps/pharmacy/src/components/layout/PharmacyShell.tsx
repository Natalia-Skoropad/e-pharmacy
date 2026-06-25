import { Suspense } from 'react';

import { Container } from '@e-pharmacy/ui/common';

import { PharmacyProtectedRoute } from '@/components/auth/PharmacyProtectedRoute';
import { PharmacyHeader } from '@/components/layout/PharmacyHeader';
import { PharmacySidebar } from '@/components/layout/PharmacySidebar';
import { PageLoader } from '@/components/pharmacy/PageLoader';

import css from './PharmacyShell.module.css';

//===================================================================

type PharmacyShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

export function PharmacyShell({ children }: PharmacyShellProps) {
  return (
    <Suspense fallback={<PageLoader label="Loading pharmacy cabinet..." />}>
      <PharmacyProtectedRoute>
        <div className={css.shell}>
          <PharmacyHeader />
          <Container className={css.body} variant="wide">
            <PharmacySidebar />
            <div className={css.content}>{children}</div>
          </Container>
        </div>
      </PharmacyProtectedRoute>
    </Suspense>
  );
}
