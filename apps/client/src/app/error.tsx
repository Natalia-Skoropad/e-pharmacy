'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/routes';

//===================================================================

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

function AppError({ error, reset }: AppErrorProps) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return (
    <ErrorPage
      eyebrow="Page error"
      title="Something went wrong"
      description="We could not load this page right now. Try again, or return home and continue choosing products and pharmacies."
      onRetry={reset}
      homeHref={ROUTES.HOME}
      variant="brand"
      image={STATUS_PAGE_IMAGE}
    />
  );
}

export default AppError;
