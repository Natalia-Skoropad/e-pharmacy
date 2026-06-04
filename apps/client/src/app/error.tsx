'use client';

import { ErrorPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@e-pharmacy/config/routes';

//===================================================================

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

//===================================================================

function AppError({ error: _error, reset }: AppErrorProps) {
  void _error;

  return (
    <ErrorPage
      title="Something went wrong, but your route is still safe"
      description="We could not load this page right now. Try again, or return to a stable section and continue choosing medicines and pharmacies."
      onRetry={reset}
      homeHref={ROUTES.HOME}
    />
  );
}

export default AppError;
