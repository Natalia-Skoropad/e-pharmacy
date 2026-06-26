'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/common';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { PharmacyProtectedRoute } from '@/components/auth/PharmacyProtectedRoute';
import { PharmacyHeader } from '@/components/layout/PharmacyHeader';
import { PharmacySidebar } from '@/components/layout/PharmacySidebar';

import css from './PharmacyShell.module.css';

//===================================================================

type PharmacyShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

function PharmacyShellContent({ children }: PharmacyShellProps) {
  const pathname = usePathname();
  const isProfilePage = pathname === '/pharmacy/profile';

  return (
    <PharmacyProtectedRoute>
      <div className={css.shell}>
        <PharmacyHeader />
        <Container
          className={clsx(css.body, isProfilePage && css.bodyPlain)}
          variant="wide"
        >
          {isProfilePage ? null : <PharmacySidebar />}
          <div className={css.content}>{children}</div>
        </Container>
      </div>
    </PharmacyProtectedRoute>
  );
}

export function PharmacyShell({ children }: PharmacyShellProps) {
  return (
    <Suspense fallback={<PageLoader label="Loading pharmacy cabinet..." />}>
      <PharmacyShellContent>{children}</PharmacyShellContent>
    </Suspense>
  );
}
