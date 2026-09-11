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

import css from './PharmacyShell.module.css';

//===================================================================

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'pharmacy-sidebar-collapsed';
const SIDEBAR_COLLAPSED_CHANGE_EVENT = 'pharmacy:sidebar-collapsed-change';

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

let sidebarCollapsedFallback = false;

//===================================================================

function getSidebarCollapsedSnapshot(): boolean {
  try {
    const storedValue = window.localStorage.getItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY
    );

    if (storedValue === 'true' || storedValue === 'false') {
      sidebarCollapsedFallback = storedValue === 'true';
    }
  } catch {
    // Keep the in-memory value when browser storage is unavailable.
  }

  return sidebarCollapsedFallback;
}

function getServerSidebarCollapsedSnapshot(): boolean {
  return false;
}

//===================================================================

function subscribeToSidebarCollapsed(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_COLLAPSED_STORAGE_KEY) return;

    sidebarCollapsedFallback = event.newValue === 'true';
    onStoreChange();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onStoreChange);
  };
}

//===================================================================

function updateSidebarCollapsed(nextValue: boolean): void {
  sidebarCollapsedFallback = nextValue;

  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(nextValue)
    );
  } catch {
    // The in-memory snapshot keeps the UI functional without storage.
  }

  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_CHANGE_EVENT));
}

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
