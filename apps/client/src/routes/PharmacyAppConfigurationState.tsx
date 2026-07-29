'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import { ROUTES } from '@/lib/routes';

//===================================================================

export function PharmacyAppConfigurationState({
  message,
}: Readonly<{ message: string }>) {
  return (
    <ErrorPage
      title="The pharmacy application is unavailable"
      description={message}
      homeHref={ROUTES.HOME}
      retryLabel="Reload configuration"
      onRetry={() => window.location.reload()}
    />
  );
}
