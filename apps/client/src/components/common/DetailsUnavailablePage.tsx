'use client';

import { useRouter } from 'next/navigation';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import type { ServerDataErrorContext } from '@/lib/api/resource-state';
import { ROUTES } from '@/lib/routes';

import {
  formatDetailsSupportReference,
  getDetailsUnavailableCopy,
  type DetailsEntityLabel,
} from './details-unavailable-copy';

//===================================================================

export type DetailsUnavailablePageProps = Readonly<{
  entityLabel: DetailsEntityLabel;
  error: ServerDataErrorContext;
}>;

//===================================================================

export function DetailsUnavailablePage({
  entityLabel,
  error,
}: DetailsUnavailablePageProps) {
  const router = useRouter();
  const copy = getDetailsUnavailableCopy(entityLabel, error.reason);

  return (
    <main>
      <ErrorPage
        title={copy.title}
        description={`${copy.description}${formatDetailsSupportReference(error.requestId)}`}
        onRetry={() => router.refresh()}
        homeHref={ROUTES.HOME}
        homeLabel="Back to home"
        retryLabel={copy.retryLabel}
      />
    </main>
  );
}
