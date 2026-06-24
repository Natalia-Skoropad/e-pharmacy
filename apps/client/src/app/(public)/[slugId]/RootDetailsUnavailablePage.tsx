'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/routes';

//===================================================================

type DataUnavailableReason = 'timeout' | 'server_error' | 'network';

//===================================================================

type RootDetailsUnavailablePageProps = {
  reason: DataUnavailableReason;
};

//===================================================================

function getDescription(reason: DataUnavailableReason): string {
  if (reason === 'timeout') {
    return 'Service temporarily unavailable. The product or pharmacy details did not load in time. Please try again.';
  }

  if (reason === 'network') {
    return 'Service temporarily unavailable. We could not reach the backend API right now. Please try again.';
  }

  return 'Service temporarily unavailable. We could not load product or pharmacy details right now. Please try again.';
}

//===================================================================

function RootDetailsUnavailablePage({
  reason,
}: RootDetailsUnavailablePageProps) {
  return (
    <ErrorPage
      title="Service temporarily unavailable"
      description={getDescription(reason)}
      onRetry={() => window.location.reload()}
      homeHref={ROUTES.HOME}
      homeLabel="Back to home"
      retryLabel="Try again"
    />
  );
}

export default RootDetailsUnavailablePage;
