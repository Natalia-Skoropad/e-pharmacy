'use client';

import { useEffect } from 'react';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { reportRenderError } from '@/lib/errors/report-render-error';
import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reportRenderError(error, 'route-boundary');
  }, [error]);

  return (
    <SharedErrorPage
      title="Something went wrong, but your route is still safe"
      description="The pharmacy cabinet could not render this page. Please try again or return to the dashboard."
      eyebrow="Route guard"
      homeHref={PHARMACY_ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
      retryLabel="Try again"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      onRetry={reset}
    />
  );
}

export default ErrorPage;
