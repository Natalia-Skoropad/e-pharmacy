import { createElement, type ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import {
  Boxes,
  Building2,
  FilePlus2,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
} from 'lucide-react';

import type {
  NavigationGroupItem,
  NavigationItem,
  NavigationLinkItem,
} from '@e-pharmacy/ui/navigation';

import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

const ICON_SIZE = 18;

export type AdminNavigationItem = NavigationItem<ReactNode>;
export type AdminNavigationLinkItem = NavigationLinkItem<ReactNode>;
export type AdminNavigationGroupItem = NavigationGroupItem<ReactNode>;

//===================================================================

function createNavigationIcon(icon: LucideIcon): ReactNode {
  return createElement(icon, {
    size: ICON_SIZE,
    'aria-hidden': true,
  });
}

//===================================================================

export const ADMIN_NAVIGATION: readonly AdminNavigationItem[] = [
  {
    label: 'Dashboard',
    href: ADMIN_ROUTES.DASHBOARD,
    icon: createNavigationIcon(LayoutDashboard),
  },
  {
    label: 'Pharmacy Owners',
    href: ADMIN_ROUTES.PHARMACY_OWNERS,
    icon: createNavigationIcon(UserCog),
  },
  {
    label: 'Pharmacies',
    href: ADMIN_ROUTES.PHARMACIES,
    icon: createNavigationIcon(Building2),
  },
  {
    label: 'Products',
    href: ADMIN_ROUTES.PRODUCTS,
    icon: createNavigationIcon(Boxes),
  },
  {
    label: 'Product Requests',
    href: ADMIN_ROUTES.PRODUCT_REQUESTS,
    icon: createNavigationIcon(FilePlus2),
  },
  {
    label: 'Clients',
    href: ADMIN_ROUTES.CLIENTS,
    icon: createNavigationIcon(Users),
  },
  {
    label: 'Orders',
    href: ADMIN_ROUTES.ORDERS,
    icon: createNavigationIcon(ShoppingBag),
  },
  {
    type: 'group',
    label: 'Reviews',
    icon: createNavigationIcon(MessageSquareText),
    children: [
      {
        label: 'Pharmacy reviews',
        href: ADMIN_ROUTES.REVIEWS_PHARMACIES,
      },
      {
        label: 'Product reviews',
        href: ADMIN_ROUTES.REVIEWS_PRODUCTS,
      },
    ],
  },
  {
    type: 'group',
    label: 'Settings',
    icon: createNavigationIcon(Settings),
    children: [
      {
        label: 'Employees',
        href: ADMIN_ROUTES.SETTINGS_EMPLOYEES,
      },
      {
        label: 'Site pages',
        href: ADMIN_ROUTES.SETTINGS_SITE_PAGES,
      },
      {
        label: 'Product categories',
        href: ADMIN_ROUTES.SETTINGS_PRODUCT_CATEGORIES,
      },
    ],
  },
];

//===================================================================

function isPathWithinRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

//===================================================================

export function getAdminNavigationItemByPathname(
  pathname: string
): AdminNavigationLinkItem | AdminNavigationGroupItem | null {
  for (const item of ADMIN_NAVIGATION) {
    if (item.type === 'group') {
      if (
        item.children.some((child) => isPathWithinRoute(pathname, child.href))
      ) {
        return item;
      }

      continue;
    }

    if (isPathWithinRoute(pathname, item.href)) return item;
  }

  return null;
}
