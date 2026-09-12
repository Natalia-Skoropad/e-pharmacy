import { createElement } from 'react';
import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import {
  Boxes,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Users,
} from 'lucide-react';

import { PHARMACY_ROUTES, matchPharmacyRoute } from '@/lib/routes';

//===================================================================

const ICON_SIZE = 18;

//===================================================================

export type PharmacyNavigationItem = Readonly<{
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
  disabled?: boolean;
}>;

//===================================================================

function createNavigationIcon(icon: LucideIcon): ReactNode {
  return createElement(icon, {
    size: ICON_SIZE,
    'aria-hidden': true,
  });
}

//===================================================================

export const PHARMACY_NAVIGATION: readonly PharmacyNavigationItem[] = [
  {
    label: 'Dashboard',
    href: PHARMACY_ROUTES.DASHBOARD,
    icon: createNavigationIcon(LayoutDashboard),
  },
  {
    label: 'Orders',
    href: PHARMACY_ROUTES.ORDERS,
    icon: createNavigationIcon(ShoppingBag),
  },
  {
    label: 'Clients',
    href: PHARMACY_ROUTES.CLIENTS,
    icon: createNavigationIcon(Users),
  },
  {
    label: 'Own products',
    href: PHARMACY_ROUTES.PRODUCTS,
    icon: createNavigationIcon(Boxes),
  },
  {
    label: 'All products',
    href: PHARMACY_ROUTES.ALL_PRODUCTS,
    icon: createNavigationIcon(PackageSearch),
  },
  {
    label: 'Product requests',
    href: PHARMACY_ROUTES.PRODUCT_REQUESTS,
    icon: createNavigationIcon(FilePlus2),
  },
];

//===================================================================

const PHARMACY_PROFILE_PRESENTATION: PharmacyNavigationItem = {
  label: 'Pharmacy profile',
  href: PHARMACY_ROUTES.PROFILE,
  icon: createNavigationIcon(ClipboardList),
};

//===================================================================

export function getPharmacyNavigationItemByPathname(
  pathname: string
): PharmacyNavigationItem | null {
  const route = matchPharmacyRoute(pathname);

  if (route.family === 'profile') {
    return PHARMACY_PROFILE_PRESENTATION;
  }

  if (!route.basePath) return null;

  return (
    PHARMACY_NAVIGATION.find((item) => item.href === route.basePath) ?? null
  );
}
