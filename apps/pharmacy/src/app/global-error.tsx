'use client';

import { useEffect } from 'react';

import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { reportRenderError } from '@/lib/errors/report-render-error';
import { PHARMACY_ROUTES } from '@/lib/routes';

import './styles.css';

//===================================================================

type GlobalErrorProps = Readonly<{
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

function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportRenderError(error, 'root-layout');
  }, [error]);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <title>Something went wrong | Pharmacy Cabinet</title>
      </head>
      <body>
        <SharedErrorPage
          title="Something went wrong"
          description="The pharmacy cabinet could not start correctly. Please try again or return to the dashboard."
          eyebrow="Application error"
          homeHref={PHARMACY_ROUTES.DASHBOARD}
          homeLabel="Back to dashboard"
          retryLabel="Try again"
          variant="brand"
          landmark="main"
          image={STATUS_PAGE_IMAGE}
          onRetry={reset}
        />
      </body>
    </html>
  );
}

export default GlobalError;
