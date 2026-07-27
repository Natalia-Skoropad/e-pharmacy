import { createElement } from 'react';
import type { ReactNode } from 'react';

import {
  Boxes,
  FilePlus2,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Users,
} from 'lucide-react';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

const ICON_SIZE = 18;

//===================================================================

type PharmacyNavigationItem = Readonly<{
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
  disabled?: boolean;
}>;

//===================================================================

export const PHARMACY_NAVIGATION: readonly PharmacyNavigationItem[] = [
  {
    label: 'Dashboard',
    href: PHARMACY_ROUTES.DASHBOARD,
    icon: createElement(LayoutDashboard, { size: ICON_SIZE }),
  },
  {
    label: 'Orders',
    href: PHARMACY_ROUTES.ORDERS,
    icon: createElement(ShoppingBag, { size: ICON_SIZE }),
  },
  {
    label: 'Clients',
    href: PHARMACY_ROUTES.CLIENTS,
    icon: createElement(Users, { size: ICON_SIZE }),
  },
  {
    label: 'Own products',
    href: PHARMACY_ROUTES.PRODUCTS,
    icon: createElement(Boxes, { size: ICON_SIZE }),
  },
  {
    label: 'All products',
    href: PHARMACY_ROUTES.ALL_PRODUCTS,
    icon: createElement(PackageSearch, { size: ICON_SIZE }),
  },
  {
    label: 'Product requests',
    href: PHARMACY_ROUTES.PRODUCT_REQUESTS,
    icon: createElement(FilePlus2, { size: ICON_SIZE }),
  },
];
