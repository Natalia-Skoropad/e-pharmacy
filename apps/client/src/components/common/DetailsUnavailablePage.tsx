'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import type { DataUnavailableReason } from '@/lib/api/resource-state';
import { ROUTES } from '@/lib/routes';

//===================================================================

type DetailsUnavailablePageProps = Readonly<{
  entityLabel: 'product' | 'pharmacy';
  reason: DataUnavailableReason;
}>;

//===================================================================

function getDescription(
  entityLabel: DetailsUnavailablePageProps['entityLabel'],
  reason: DataUnavailableReason
): string {
  if (reason === 'timeout') {
    return `Service temporarily unavailable. The ${entityLabel} details did not load in time. Please try again.`;
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

  return `Service temporarily unavailable. We could not load the ${entityLabel} details right now. Please try again.`;
}

//===================================================================

export function DetailsUnavailablePage({
  entityLabel,
  reason,
}: DetailsUnavailablePageProps) {
  return (
    <ErrorPage
      title="Service temporarily unavailable"
      description={getDescription(entityLabel, reason)}
      onRetry={() => window.location.reload()}
      homeHref={ROUTES.HOME}
      homeLabel="Back to home"
      retryLabel="Try again"
    />
  );
}
