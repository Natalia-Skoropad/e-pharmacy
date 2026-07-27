import { NotFoundPage as SharedNotFoundPage } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

function NotFoundPage() {
  return (
    <SharedNotFoundPage
      title="Page not found"
      description="The page you are looking for does not exist in Pharmacy Cabinet."
      eyebrow="404"
      homeHref={PHARMACY_ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
    />
  );
}

export default NotFoundPage;
