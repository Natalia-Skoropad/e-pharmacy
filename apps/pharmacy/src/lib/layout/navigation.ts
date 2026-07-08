import { createElement } from 'react';

import {
  Boxes,
  FilePlus2,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Users,
} from 'lucide-react';

import type { SideMenuItem } from '@e-pharmacy/ui/layout';

import {
  PHARMACY_ALL_PRODUCTS,
  PHARMACY_CLIENTS,
  PHARMACY_DASHBOARD,
  PHARMACY_ORDERS,
  PHARMACY_PRODUCTS,
  PHARMACY_PRODUCT_REQUESTS,
} from './routes';

//===================================================================

const ICON_SIZE = 18;

//===================================================================

export const PHARMACY_NAVIGATION: readonly SideMenuItem[] = [
  {
    label: 'Dashboard',
    href: PHARMACY_DASHBOARD,
    icon: createElement(LayoutDashboard, { size: ICON_SIZE }),
  },
  {
    label: 'Orders',
    href: PHARMACY_ORDERS,
    icon: createElement(ShoppingBag, { size: ICON_SIZE }),
  },
  {
    label: 'Clients',
    href: PHARMACY_CLIENTS,
    icon: createElement(Users, { size: ICON_SIZE }),
  },
  {
    label: 'Own products',
    href: PHARMACY_PRODUCTS,
    icon: createElement(Boxes, { size: ICON_SIZE }),
  },
  {
    label: 'All products',
    href: PHARMACY_ALL_PRODUCTS,
    icon: createElement(PackageSearch, { size: ICON_SIZE }),
  },
  {
    label: 'Product requests',
    href: PHARMACY_PRODUCT_REQUESTS,
    icon: createElement(FilePlus2, { size: ICON_SIZE }),
  },
];

//===================================================================

export const PHARMACY_MOBILE_NAVIGATION: readonly SideMenuItem[] =
  PHARMACY_NAVIGATION;
