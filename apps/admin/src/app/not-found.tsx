import { NotFoundPage as SharedNotFoundPage } from '@e-pharmacy/ui/status-pages';

import { ADMIN_ROUTES } from '@/lib/routes';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

//===================================================================

function NotFoundPage() {
  return (
    <SharedNotFoundPage
      title="Page not found"
      description="The page you are looking for does not exist in Admin Cabinet."
      eyebrow="404"
      homeHref={ADMIN_ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
    />
  );
}

export default NotFoundPage;
