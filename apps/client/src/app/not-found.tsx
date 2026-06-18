import { NotFoundPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/routes';

//===================================================================

function AppNotFound() {
  return (
    <NotFoundPage
      title="Page not found"
      description="The link may be outdated, moved, or typed with a tiny typo. Go back home or open the product catalog to continue shopping safely."
      homeHref={ROUTES.HOME}
      secondaryAction={{
        href: ROUTES.PRODUCTS_CATALOG,
        label: 'View product catalog',
        variant: 'secondary',
      }}
    />
  );
}

export default AppNotFound;
