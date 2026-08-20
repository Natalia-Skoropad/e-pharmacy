'use client';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

type ErrorPageProps = Readonly<{
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

function ErrorPage({ reset }: ErrorPageProps) {
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
