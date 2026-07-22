'use client';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { getPharmacyDashboardPath } from '@e-pharmacy/config/pharmacy';

//===================================================================

type ErrorPageProps = Readonly<{
  reset: () => void;
}>;

//===================================================================

function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <SharedErrorPage
      title="Something went wrong, but your route is still safe"
      description="The pharmacy cabinet could not render this page. Please try again or return to the dashboard."
      eyebrow="Route guard"
      homeHref={getPharmacyDashboardPath()}
      homeLabel="Back to dashboard"
      retryLabel="Try again"
      onRetry={reset}
    />
  );
}

export default ErrorPage;
