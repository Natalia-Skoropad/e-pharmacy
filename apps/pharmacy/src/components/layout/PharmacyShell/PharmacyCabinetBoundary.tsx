'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Container } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';
import { ErrorPage, PageLoader } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  isOwnerClientDetailPath,
  isOwnerClientsListPath,
} from '@/lib/pharmacies/selected-pharmacy-scope';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

type PharmacyCabinetBoundaryRuntimeProps = Readonly<{
  profile: CurrentPharmacySummary | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  children: ReactNode;
  pathname?: string;
}>;

//===================================================================

export function PharmacyCabinetBoundaryRuntime({
  profile,
  isLoading,
  error,
  onRetry,
  children,
  pathname,
}: PharmacyCabinetBoundaryRuntimeProps) {
  // Owner account pages (including the global Admin product catalog) are
  // independent of the selected pharmacy. /me/summary may legitimately fail
  // with SELECTION_REQUIRED for owners with multiple pharmacies, but their
  // resources authorize independently. Only operational pages require it.
  if (
    (pathname &&
      (isOwnerClientsListPath(pathname) ||
        isOwnerClientDetailPath(pathname))) ||
    pathname === PHARMACY_ROUTES.ALL_PRODUCTS ||
    pathname?.startsWith(`${PHARMACY_ROUTES.ALL_PRODUCTS}/`) ||
    pathname === PHARMACY_ROUTES.PROFILE ||
    pathname?.startsWith(`${PHARMACY_ROUTES.PROFILE}/`) ||
    pathname === PHARMACY_ROUTES.PHARMACIES ||
    pathname?.startsWith(`${PHARMACY_ROUTES.PHARMACIES}/`)
  ) {
    return children;
  }

  if (!profile && isLoading) {
    return <PageLoader label="Loading pharmacy cabinet..." />;
  }

  if (!profile && error) {
    return (
      <ErrorPage
        title="We could not load your pharmacy cabinet"
        description="The pharmacy account summary is temporarily unavailable. Retry before opening cabinet data so unavailable resources are not shown as empty statistics."
        eyebrow="Cabinet data"
        homeHref={PHARMACY_ROUTES.DASHBOARD}
        homeLabel="Back to dashboard"
        retryLabel="Retry pharmacy data"
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
        onRetry={onRetry}
      />
    );
  }

  // A valid owner without a pharmacy must be able to open personal tabs.
  // Operational pages require a pharmacy and should not load invalid data.
  if (
    !profile &&
    pathname &&
    pathname !== PHARMACY_ROUTES.PROFILE &&
    !pathname.startsWith(`${PHARMACY_ROUTES.PROFILE}/`)
  ) {
    return (
      <main>
        <Container>
          <StatusBanner
            tone="info"
            title="No pharmacies yet"
            message="Your owner account is ready. Create a pharmacy draft or open your personal profile to manage your account."
            meta={
              <Link href={PHARMACY_ROUTES.PHARMACIES}>Open pharmacies</Link>
            }
          />
        </Container>
      </main>
    );
  }

  return children;
}

//===================================================================

export function PharmacyCabinetBoundary({ children }: { children: ReactNode }) {
  const { profile, isLoading, error, refresh } = usePharmacyProfile();
  const pathname = usePathname();

  return (
    <PharmacyCabinetBoundaryRuntime
      profile={profile}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
      pathname={pathname}
    >
      {children}
    </PharmacyCabinetBoundaryRuntime>
  );
}
