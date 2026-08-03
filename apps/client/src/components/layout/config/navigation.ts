import { Building2, House, PackageSearch } from 'lucide-react';

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

//===================================================================

const CLIENT_NAV_ICONS = {
  [ROUTES.HOME]: House,
  [ROUTES.PHARMACIES]: Building2,
  [ROUTES.PRODUCTS_CATALOG]: PackageSearch,
} as const;

//===================================================================

export const MOBILE_MAIN_NAV_ITEMS = CLIENT_NAV_LINKS.map((link) => ({
  ...link,
  icon: CLIENT_NAV_ICONS[link.href],
}));
