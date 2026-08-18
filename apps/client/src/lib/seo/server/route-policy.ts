import 'server-only';

import { CLIENT_RESERVED_APP_PREFIXES, ROUTES } from '@/lib/routes';

import type { SitemapEntryConfig } from './sitemap';

//===================================================================

export const STATIC_SITEMAP_ENTRIES = [
  { path: ROUTES.HOME, priority: 1, changeFrequency: 'weekly' },
  { path: ROUTES.PHARMACIES, priority: 0.8, changeFrequency: 'daily' },
  {
    path: ROUTES.PRODUCTS_CATALOG,
    priority: 0.8,
    changeFrequency: 'daily',
  },
] as const satisfies readonly SitemapEntryConfig[];

//===================================================================

export function createApprovedInfoSitemapEntries(
  approvedPaths: readonly string[]
): SitemapEntryConfig[] {
  return approvedPaths.map((path) => ({
    path,
    priority: path === ROUTES.DELIVERY_PAYMENT ? 0.5 : 0.4,
    changeFrequency: 'monthly',
  }));
}

//===================================================================

const ROBOTS_PRIVATE_ROUTE_ROOTS = [
  '/api',
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
  ROUTES.PROFILE,
  ...CLIENT_RESERVED_APP_PREFIXES.map((segment) => `/${segment}`),
] as const;

//===================================================================

export const ROBOTS_DISALLOW_ROUTES = ROBOTS_PRIVATE_ROUTE_ROOTS.flatMap(
  (route) => [route, `${route}/`]
);
