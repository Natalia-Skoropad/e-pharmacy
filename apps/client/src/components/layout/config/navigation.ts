import { ROUTES } from '@/lib/routes';

//===================================================================

export const CLIENT_NAV_LINKS = [
  {
    label: 'Home',
    href: ROUTES.HOME,
  },
  {
    label: 'Pharmacies',
    href: ROUTES.PHARMACIES,
  },
  {
    label: 'Product catalog',
    href: ROUTES.PRODUCTS_CATALOG,
  },
] as const;
