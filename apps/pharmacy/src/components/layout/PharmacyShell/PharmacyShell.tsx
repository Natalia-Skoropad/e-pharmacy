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
import { getPharmacyBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';

import css from './PharmacyShell.module.css';

//===================================================================

const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';

//===================================================================

const SECTIONS_WITH_HIDDEN_LIST_BREADCRUMBS = new Set([
  'orders',
  'clients',
  'products',
  'all-products',
  'product-requests',
]);

const SECTIONS_WITH_PLAIN_DETAILS = new Set([
  'orders',
  'clients',
  'products',
  'all-products',
  'product-requests',
]);

//===================================================================

function isPharmacyFilterSegment(segment: string | undefined): boolean {
  if (!segment) return false;

  return [
    'status-',
    'delivery-',
    'payment-',
    'date-',
    'search-',
    'client-id-',
    'email-',
    'phone-',
    'address-',
    'category-',
    'stock-',
    'article-',
    'name-',
    'page-',
    'added-to-my-pharmacy-',
  ].some((prefix) => segment.startsWith(prefix));
}

//===================================================================

function getPharmacyPathState(pathname: string) {
  const cleanPathname = pathname.split('?')[0] ?? pathname;
  const [, section, id] = cleanPathname.split('/').filter(Boolean);
  const isListPage = Boolean(
    section &&
    SECTIONS_WITH_HIDDEN_LIST_BREADCRUMBS.has(section) &&
    (!id || isPharmacyFilterSegment(id))
  );
  const isDetailPage = Boolean(
    section &&
    SECTIONS_WITH_PLAIN_DETAILS.has(section) &&
    id &&
    id !== 'new' &&
    !isPharmacyFilterSegment(id)
  );

  return { isListPage, isDetailPage };
}

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
  const isDashboardPage = pathname === '/pharmacy/dashboard';
  const { isListPage, isDetailPage } = getPharmacyPathState(pathname);
  const shouldShowBreadcrumbs = !isDashboardPage && !isListPage;
  const shouldShowSidebar = !isProfilePage && !isDetailPage;

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
        <Container className={css.container}>
          {shouldShowBreadcrumbs ? (
            <Breadcrumbs items={breadcrumbs} className={css.breadcrumbs} />
          ) : null}

          <div
            className={clsx(
              css.body,
              (isProfilePage || isDetailPage) && css.bodyPlain
            )}
          >
            {shouldShowSidebar ? <PharmacySidebar /> : null}
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
