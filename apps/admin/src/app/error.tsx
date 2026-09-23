'use client';

import { useEffect } from 'react';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { reportRenderError } from '@/lib/errors/report-render-error';
import { ADMIN_ROUTES } from '@/lib/routes';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

//===================================================================

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

type RouteErrorFallbackProps = Readonly<{
  reset: () => void;
}>;

//===================================================================

export function RouteErrorFallback({ reset }: RouteErrorFallbackProps) {
  return (
    <SharedErrorPage
      title="Something went wrong"
      description="The admin cabinet could not display this page. Please try again."
      eyebrow="Page error"
      homeHref={ADMIN_ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
      retryLabel="Try again"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      onRetry={reset}
    />
  );
}

//===================================================================

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reportRenderError(error, 'route-boundary');
  }, [error]);

  return <RouteErrorFallback reset={reset} />;
}

export default ErrorPage;
