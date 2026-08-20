import { NotFoundPage as SharedNotFoundPage } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

function NotFoundPage() {
  return (
    <SharedNotFoundPage
      title="Page not found"
      description="The page you are looking for does not exist in Pharmacy Cabinet."
      eyebrow="404"
      homeHref={PHARMACY_ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      secondaryAction={{
        href: PHARMACY_ROUTES.PRODUCTS,
        label: 'View pharmacy products',
        variant: 'secondary',
      }}
    />
  );
}

export default NotFoundPage;
