import { Suspense } from 'react';

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
          <div className={css.body}>
            <PharmacySidebar />
            <div className={css.content}>{children}</div>
          </div>
        </div>
      </PharmacyProtectedRoute>
    </Suspense>
  );
}
