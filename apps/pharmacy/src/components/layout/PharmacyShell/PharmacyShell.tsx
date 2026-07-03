'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/common';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { PharmacyProtectedRoute } from '@/components/auth/PharmacyProtectedRoute';
import { PharmacyHeader } from '@/components/layout/PharmacyHeader';
import { PharmacySidebar } from '@/components/layout/PharmacySidebar';
import { getPharmacyBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';

import css from './PharmacyShell.module.css';

//===================================================================

const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'pharmacy-sidebar-collapsed';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;

    return (
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
    );
  });

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(nextValue)
      );

      return nextValue;
    });
  };

  return (
    <PharmacyProtectedRoute>
      <div className={css.shell}>
        <Container className={css.container}>
          <div
            className={clsx(
              css.layout,
              isSidebarCollapsed && css.layoutCollapsed
            )}
          >
            <PharmacySidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapsed={toggleSidebar}
            />

            <div className={css.workspace}>
              <PharmacyHeader breadcrumbs={breadcrumbs} />
              <div className={css.content}>{children}</div>
            </div>
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
