'use client';

import { useRouter } from 'next/navigation';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import { ROUTES } from '@/lib/routes';

//===================================================================

export function PharmacyAppConfigurationState({
  message,
}: Readonly<{ message: string }>) {
  const router = useRouter();

  return (
    <ErrorPage
      title="The pharmacy application is unavailable"
      description={message}
      homeHref={ROUTES.HOME}
      retryLabel="Reload configuration"
      onRetry={() => router.refresh()}
    />
  );
}
