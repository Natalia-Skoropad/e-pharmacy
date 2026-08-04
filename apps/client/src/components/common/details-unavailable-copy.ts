import type { DataUnavailableReason } from '@/lib/api/resource-state';

//===================================================================

export type DetailsEntityLabel = 'product' | 'pharmacy' | 'page';

//===================================================================

export type DetailsUnavailableCopy = Readonly<{
  title: string;
  description: string;
  retryLabel: string;
}>;

//===================================================================

export function getDetailsUnavailableCopy(
  entityLabel: DetailsEntityLabel,
  reason: DataUnavailableReason
): DetailsUnavailableCopy {
  const entityDetails =
    entityLabel === 'page' ? 'page' : `${entityLabel} details`;

  switch (reason) {
    case 'timeout':
      return {
        title: 'This is taking longer than expected',
        description: `The ${entityDetails} did not load in time. Please try again.`,
        retryLabel: 'Try again',
      };

    case 'network':
      return {
        title: 'Connection interrupted',
        description: `We could not load the ${entityDetails}. Check your connection and try again.`,
        retryLabel: 'Try again',
      };

    case 'rate_limit':
      return {
        title: 'Please wait a moment',
        description: `Too many requests were made while loading the ${entityDetails}. Please try again shortly.`,
        retryLabel: 'Try again',
      };

    case 'invalid_response':
      return {
        title: 'The information could not be verified',
        description: `The ${entityDetails} are temporarily unavailable because the response could not be validated.`,
        retryLabel: 'Retry',
      };

    case 'unauthorized':
      return {
        title: 'Your session needs attention',
        description: `The ${entityDetails} could not be loaded with the current session. Refresh the page or sign in again.`,
        retryLabel: 'Refresh session',
      };

    case 'forbidden':
      return {
        title: 'Access is not available',
        description: `Your account cannot open these ${entityDetails}.`,
        retryLabel: 'Check again',
      };

    case 'server_error':

    case 'service_unavailable':
      return {
        title: 'Service temporarily unavailable',
        description: `We could not load the ${entityDetails} right now. Please try again later.`,
        retryLabel: 'Try again',
      };
  }
}

//===================================================================

export function formatDetailsSupportReference(requestId?: string): string {
  if (!requestId) return '';
  const shortRequestId = requestId.trim().slice(0, 12);
  return shortRequestId ? ` Support reference: ${shortRequestId}.` : '';
}
