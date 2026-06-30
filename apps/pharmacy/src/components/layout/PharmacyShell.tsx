'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { PharmacyProtectedRoute } from '@/components/auth/PharmacyProtectedRoute';
import { PharmacyHeader } from '@/components/layout/PharmacyHeader';
import { PharmacySidebar } from '@/components/layout/PharmacySidebar';
import { getPharmacyBreadcrumbsByPathname } from '@/lib/pharmacy/breadcrumbs';

import css from './PharmacyShell.module.css';

//===================================================================

const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';

//===================================================================

type BreadcrumbLabelEventDetail = {
  pathname?: string;
  label?: string;
};

type BreadcrumbOverride = {
  pathname: string;
  label: string;
};

//===================================================================

type PharmacyShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

function PharmacyShellContent({ children }: PharmacyShellProps) {
  const pathname = usePathname();
  const [breadcrumbOverride, setBreadcrumbOverride] =
    useState<BreadcrumbOverride | null>(null);
  const isProfilePage = pathname === '/pharmacy/profile';
  const currentDetailLabel =
    breadcrumbOverride?.pathname === pathname
      ? breadcrumbOverride.label
      : undefined;
  const breadcrumbs = getPharmacyBreadcrumbsByPathname(
    pathname,
    currentDetailLabel
  );

  useEffect(() => {
    const handleBreadcrumbLabel = (event: Event) => {
      const { detail } = event as CustomEvent<BreadcrumbLabelEventDetail>;

      if (!detail?.pathname || !detail.label) return;

      setBreadcrumbOverride({
        pathname: detail.pathname,
        label: detail.label,
      });
    };

    window.addEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);

    return () => {
      window.removeEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);
    };
  }, []);

  return (
    <PharmacyProtectedRoute>
      <div className={css.shell}>
        <PharmacyHeader />
        <Container className={css.container} variant="wide">
          <Breadcrumbs items={breadcrumbs} className={css.breadcrumbs} />

          <div className={clsx(css.body, isProfilePage && css.bodyPlain)}>
            {isProfilePage ? null : <PharmacySidebar />}
            <div className={css.content}>{children}</div>
          </div>
        </Container>
      </div>
    </PharmacyProtectedRoute>
  );
}

//===================================================================

export function PharmacyShell({ children }: PharmacyShellProps) {
  return (
    <Suspense fallback={<PageLoader label="Loading pharmacy cabinet..." />}>
      <PharmacyShellContent>{children}</PharmacyShellContent>
    </Suspense>
  );
}
