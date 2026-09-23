'use client';

import { useEffect } from 'react';

import '@e-pharmacy/ui/styles/tokens.css';
import '@e-pharmacy/ui/styles/reset.css';
import '@e-pharmacy/ui/styles/base.css';
import '@e-pharmacy/ui/styles/utilities.css';

import { ErrorPage as SharedErrorPage } from '@e-pharmacy/ui/status-pages';

import { reportRenderError } from '@/lib/errors/report-render-error';
import { ADMIN_ROUTES } from '@/lib/routes';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

import './styles.css';

//===================================================================

type GlobalErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

//===================================================================

function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportRenderError(error, 'root-layout');
  }, [error]);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <title>Something went wrong | Admin Cabinet</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <body>
        <SharedErrorPage
          title="Something went wrong"
          description="The admin cabinet could not start correctly. Please try again."
          eyebrow="Application error"
          homeHref={ADMIN_ROUTES.DASHBOARD}
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
