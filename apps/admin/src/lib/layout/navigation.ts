import { createElement, type ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import {
  Boxes,
  Building2,
  FilePlus2,
  History,
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
import type { AdminAccess } from '@/lib/permissions/admin-access';

import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
} from '@/lib/permissions/admin-permissions';

import { canAdmin } from '@/lib/permissions/can-admin';

//===================================================================

const ICON_SIZE = 18;

export type AdminNavigationItem = NavigationItem<ReactNode>;
export type AdminNavigationLinkItem = NavigationLinkItem<ReactNode>;
export type AdminNavigationGroupItem = NavigationGroupItem<ReactNode>;

type AdminNavigationLinkDefinition = AdminNavigationLinkItem &
  Readonly<{ requiredPermission?: AdminPermission }>;

type AdminNavigationGroupDefinition = Omit<
  AdminNavigationGroupItem,
  'children'
> &
  Readonly<{
    children: readonly AdminNavigationLinkDefinition[];
  }>;

type AdminNavigationDefinition =
  | AdminNavigationLinkDefinition
  | AdminNavigationGroupDefinition;

//===================================================================

function createNavigationIcon(icon: LucideIcon): ReactNode {
  return createElement(icon, {
    size: ICON_SIZE,
    'aria-hidden': true,
  });
}

//===================================================================

export const ADMIN_NAVIGATION_DEFINITIONS: readonly AdminNavigationDefinition[] =
  [
    {
      label: 'Dashboard',
      href: ADMIN_ROUTES.DASHBOARD,
      icon: createNavigationIcon(LayoutDashboard),
    },
    {
      label: 'Pharmacy Owners',
      href: ADMIN_ROUTES.PHARMACY_OWNERS,
      icon: createNavigationIcon(UserCog),
      requiredPermission: ADMIN_PERMISSIONS.pharmacyOwners.view,
    },
    {
      label: 'Pharmacies',
      href: ADMIN_ROUTES.PHARMACIES,
      icon: createNavigationIcon(Building2),
      requiredPermission: ADMIN_PERMISSIONS.pharmacies.view,
    },
    {
      label: 'Products',
      href: ADMIN_ROUTES.PRODUCTS,
      icon: createNavigationIcon(Boxes),
      requiredPermission: ADMIN_PERMISSIONS.products.view,
    },
    {
      label: 'Product Requests',
      href: ADMIN_ROUTES.PRODUCT_REQUESTS,
      icon: createNavigationIcon(FilePlus2),
      requiredPermission: ADMIN_PERMISSIONS.productRequests.view,
    },
    {
      label: 'Clients',
      href: ADMIN_ROUTES.CLIENTS,
      icon: createNavigationIcon(Users),
      requiredPermission: ADMIN_PERMISSIONS.clients.view,
    },
    {
      label: 'Orders',
      href: ADMIN_ROUTES.ORDERS,
      icon: createNavigationIcon(ShoppingBag),
      requiredPermission: ADMIN_PERMISSIONS.orders.view,
    },
    {
      type: 'group',
      label: 'Reviews',
      icon: createNavigationIcon(MessageSquareText),
      children: [
        {
          label: 'Pharmacy reviews',
          href: ADMIN_ROUTES.REVIEWS_PHARMACIES,
          requiredPermission: ADMIN_PERMISSIONS.pharmacyReviews.view,
        },
        {
          label: 'Product reviews',
          href: ADMIN_ROUTES.REVIEWS_PRODUCTS,
          requiredPermission: ADMIN_PERMISSIONS.productReviews.view,
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
          requiredPermission: ADMIN_PERMISSIONS.employees.view,
        },
        {
          label: 'Positions',
          href: ADMIN_ROUTES.SETTINGS_POSITIONS,
          requiredPermission: ADMIN_PERMISSIONS.positions.view,
        },
        {
          label: 'Site pages',
          href: ADMIN_ROUTES.SETTINGS_SITE_PAGES,
          requiredPermission: ADMIN_PERMISSIONS.sitePages.view,
        },
        {
          label: 'Product categories',
          href: ADMIN_ROUTES.SETTINGS_PRODUCT_CATEGORIES,
          requiredPermission: ADMIN_PERMISSIONS.categories.view,
        },
        {
          label: 'Activity history',
          href: ADMIN_ROUTES.SETTINGS_ACTIVITY,
          icon: createNavigationIcon(History),
          requiredPermission: ADMIN_PERMISSIONS.audit.view,
        },
      ],
    },
  ];

//===================================================================

function toNavigationLink(
  definition: AdminNavigationLinkDefinition
): AdminNavigationLinkItem {
  return {
    ...(definition.type ? { type: definition.type } : {}),
    label: definition.label,
    href: definition.href,
    ...(definition.icon !== undefined ? { icon: definition.icon } : {}),
    ...(definition.exact !== undefined ? { exact: definition.exact } : {}),
    ...(definition.disabled !== undefined
      ? { disabled: definition.disabled }
      : {}),
  };
}

//===================================================================

function toNavigationGroup(
  definition: AdminNavigationGroupDefinition,
  children: readonly AdminNavigationLinkItem[]
): AdminNavigationGroupItem {
  return {
    type: 'group',
    label: definition.label,
    ...(definition.icon !== undefined ? { icon: definition.icon } : {}),
    ...(definition.disabled !== undefined
      ? { disabled: definition.disabled }
      : {}),
    children,
  };
}

//===================================================================

export const ADMIN_NAVIGATION: readonly AdminNavigationItem[] =
  ADMIN_NAVIGATION_DEFINITIONS.map((definition) =>
    definition.type === 'group'
      ? toNavigationGroup(definition, definition.children.map(toNavigationLink))
      : toNavigationLink(definition)
  );

//===================================================================

export function getAdminNavigationForAccess(
  access: AdminAccess
): readonly AdminNavigationItem[] {
  const items: AdminNavigationItem[] = [];

  for (const definition of ADMIN_NAVIGATION_DEFINITIONS) {
    if (definition.type === 'group') {
      const children = definition.children
        .filter(
          (child) =>
            !child.requiredPermission ||
            canAdmin(access, child.requiredPermission)
        )
        .map(toNavigationLink);

      if (children.length > 0) {
        items.push(toNavigationGroup(definition, children));
      }

      continue;
    }

    if (
      !definition.requiredPermission ||
      canAdmin(access, definition.requiredPermission)
    ) {
      items.push(toNavigationLink(definition));
    }
  }

  return items;
}

//===================================================================

function isPathWithinRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

//===================================================================

export function getAdminNavigationItemByPathname(
  pathname: string,
  items: readonly AdminNavigationItem[] = ADMIN_NAVIGATION
): AdminNavigationLinkItem | AdminNavigationGroupItem | null {
  for (const item of items) {
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
