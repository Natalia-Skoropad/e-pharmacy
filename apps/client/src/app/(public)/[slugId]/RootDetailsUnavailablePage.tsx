'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/routes';

//===================================================================

type DataUnavailableReason =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'service_unavailable'
  | 'invalid_response'
  | 'unauthorized'
  | 'forbidden'
  | 'server_error';

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

  if (reason === 'rate_limit') {
    return 'Too many requests were made. Please wait a moment and try again.';
  }

  if (reason === 'invalid_response') {
    return 'The service returned an invalid response. Please try again later.';
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
