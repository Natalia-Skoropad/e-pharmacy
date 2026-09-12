'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/layout';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { getPharmacyBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';
import { subscribeToPharmacyBreadcrumbLabels } from '@/lib/layout/breadcrumb-label-event';
import { PharmacyProfileProvider } from '@/providers/PharmacyProfileProvider';

import { PharmacyProtectedRoute } from '@/components/auth/PharmacyProtectedRoute';
import { PharmacyHeader } from '@/components/layout/PharmacyHeader';
import { PharmacySidebar } from '@/components/layout/PharmacySidebar';

import {
  getServerSidebarCollapsedSnapshot,
  getSidebarCollapsedSnapshot,
  subscribeToSidebarCollapsed,
  updateSidebarCollapsed,
} from './sidebar-collapsed-preference';

import css from './PharmacyShell.module.css';

//===================================================================

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

  const isSidebarCollapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getServerSidebarCollapsedSnapshot
  );

  const currentDetailLabel =
    breadcrumbOverride?.pathname === pathname
      ? breadcrumbOverride.label
      : undefined;

  const breadcrumbs = getPharmacyBreadcrumbsByPathname(
    pathname,
    currentDetailLabel
  );

  useEffect(() => {
    return subscribeToPharmacyBreadcrumbLabels((detail) => {
      setBreadcrumbOverride({
        pathname: detail.pathname,
        label: detail.label,
      });
    });
  }, []);

  const toggleSidebar = () => {
    updateSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <PharmacyProtectedRoute>
      <PharmacyProfileProvider>
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
      </PharmacyProfileProvider>
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
