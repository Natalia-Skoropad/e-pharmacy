'use client';

import { useRouter } from 'next/navigation';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import { ROUTES } from '@/lib/routes';

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

function getConfigurationDescription(message: string): string {
  if (message.toLowerCase().includes('required')) {
    return 'The pharmacy application address has not been configured yet. Reload the configuration or return to the home page.';
  }

  return 'The pharmacy application cannot be opened right now. Reload the configuration or return to the home page.';
}

//===================================================================

export function PharmacyAppConfigurationState({
  message,
}: Readonly<{ message: string }>) {
  const router = useRouter();

  return (
    <ErrorPage
      eyebrow="Application unavailable"
      title="The pharmacy application is unavailable"
      description={getConfigurationDescription(message)}
      homeHref={ROUTES.HOME}
      retryLabel="Reload configuration"
      onRetry={() => router.refresh()}
      variant="brand"
      image={STATUS_PAGE_IMAGE}
    />
  );
}
