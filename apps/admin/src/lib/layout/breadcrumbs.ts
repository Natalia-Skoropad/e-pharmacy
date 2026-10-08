import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';

import { resolveAdminPharmacyOwnersRoute } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';
import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

type BreadcrumbRoute = Readonly<{
  href: string;
  label: string;
  parent?: Readonly<{
    label: string;
  }>;
}>;

//===================================================================

const BREADCRUMB_ROUTES: readonly BreadcrumbRoute[] = [
  { href: ADMIN_ROUTES.DASHBOARD, label: 'Dashboard' },
  { href: ADMIN_ROUTES.PROFILE, label: 'Profile' },
  { href: ADMIN_ROUTES.PHARMACY_OWNERS, label: 'Pharmacy Owners' },
  { href: ADMIN_ROUTES.PHARMACIES, label: 'Pharmacies' },
  { href: ADMIN_ROUTES.PRODUCTS, label: 'Products' },
  { href: ADMIN_ROUTES.PRODUCT_REQUESTS, label: 'Product Requests' },
  { href: ADMIN_ROUTES.CLIENTS, label: 'Clients' },
  { href: ADMIN_ROUTES.ORDERS, label: 'Orders' },
  {
    href: ADMIN_ROUTES.REVIEWS_PHARMACIES,
    label: 'Pharmacy reviews',
    parent: { label: 'Reviews' },
  },
  {
    href: ADMIN_ROUTES.REVIEWS_PRODUCTS,
    label: 'Product reviews',
    parent: { label: 'Reviews' },
  },
  {
    href: ADMIN_ROUTES.SETTINGS_EMPLOYEES,
    label: 'Employees',
    parent: { label: 'Settings' },
  },
  {
    href: ADMIN_ROUTES.SETTINGS_POSITIONS,
    label: 'Positions',
    parent: { label: 'Settings' },
  },
  {
    href: ADMIN_ROUTES.SETTINGS_SITE_PAGES,
    label: 'Site pages',
    parent: { label: 'Settings' },
  },
  {
    href: ADMIN_ROUTES.SETTINGS_PRODUCT_CATEGORIES,
    label: 'Product categories',
    parent: { label: 'Settings' },
  },
  {
    href: ADMIN_ROUTES.SETTINGS_ACTIVITY,
    label: 'Activity history',
    parent: { label: 'Settings' },
  },
];

//===================================================================

function isPathWithinRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

//===================================================================

export function getAdminBreadcrumbsByPathname(
  pathname: string,
  currentDetailLabel?: string
): readonly BreadcrumbItem[] {
  if (isPathWithinRoute(pathname, ADMIN_ROUTES.PHARMACY_OWNERS)) {
    const suffix = pathname
      .slice(ADMIN_ROUTES.PHARMACY_OWNERS.length)
      .replace(/^\/+|\/+$/g, '');

    const route = resolveAdminPharmacyOwnersRoute(
      suffix ? suffix.split('/') : []
    );

    if (route.kind === 'detail') {
      return [
        { label: 'Pharmacy Owners', href: ADMIN_ROUTES.PHARMACY_OWNERS },
        {
          label: currentDetailLabel ?? `Owner #${route.ownerId}`,
        },
      ];
    }

    return [{ label: 'Pharmacy Owners' }];
  }

  const route = BREADCRUMB_ROUTES.find((candidate) =>
    isPathWithinRoute(pathname, candidate.href)
  );

  if (!route) return [];

  if (!route.parent) {
    return [{ label: route.label }];
  }

  return [{ label: route.parent.label }, { label: route.label }];
}
