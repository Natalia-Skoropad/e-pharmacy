import { NotFoundPage } from '@e-pharmacy/ui/status-pages';
import { ROUTES } from '@/lib/constants/routes';

//===================================================================

function AppNotFound() {
  return (
    <NotFoundPage
      title="Page not found"
      description="The link may be outdated, moved, or typed with a tiny typo. Go back home or open the medicine catalog to continue shopping safely."
      homeHref={ROUTES.HOME}
      secondaryAction={{
        href: ROUTES.MEDICINES_CATALOG,
        label: 'View medicine catalog',
        variant: 'secondary',
      }}
    />
  );
}

export default AppNotFound;
