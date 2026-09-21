'use client';

import type { ReactNode } from 'react';

import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';
import { ErrorPage, PageLoader } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';
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
}>;

//===================================================================

export function PharmacyCabinetBoundaryRuntime({
  profile,
  isLoading,
  error,
  onRetry,
  children,
}: PharmacyCabinetBoundaryRuntimeProps) {
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

  return children;
}

//===================================================================

export function PharmacyCabinetBoundary({ children }: { children: ReactNode }) {
  const { profile, isLoading, error, refresh } = usePharmacyProfile();

  return (
    <PharmacyCabinetBoundaryRuntime
      profile={profile}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refresh()}
    >
      {children}
    </PharmacyCabinetBoundaryRuntime>
  );
}
