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

export function PharmacyAppConfigurationState({
  message,
}: Readonly<{ message: string }>) {
  const router = useRouter();

  return (
    <ErrorPage
      eyebrow="Application unavailable"
      title="The pharmacy application is unavailable"
      description={message}
      homeHref={ROUTES.HOME}
      retryLabel="Reload configuration"
      onRetry={() => router.refresh()}
      variant="brand"
      image={STATUS_PAGE_IMAGE}
    />
  );
}
