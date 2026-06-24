import { NotFoundPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/routes';

//===================================================================

const STATUS_PAGE_IMAGE = {
  src: '/images/status/status-pills.png',
  alt: '',
  width: 749,
  height: 508,
  priority: true,
};

//===================================================================

function AppNotFound() {
  return (
    <NotFoundPage
      eyebrow="404"
      title="Page not found"
      description="The link may be outdated, moved, or typed with a tiny typo. Go back home or open the product catalog to continue shopping safely."
      homeHref={ROUTES.HOME}
      variant="brand"
      image={STATUS_PAGE_IMAGE}
      secondaryAction={{
        href: ROUTES.PRODUCTS_CATALOG,
        label: 'View product catalog',
        variant: 'secondary',
      }}
    />
  );
}

export default AppNotFound;
