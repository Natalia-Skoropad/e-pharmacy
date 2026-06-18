import { ROUTES, CLIENT_RESERVED_APP_PREFIXES } from '@/lib/routes';

//===================================================================

const SITEMAP_INDEXABLE_ROUTES = [
  ROUTES.HOME,
  ROUTES.PHARMACIES,
  ROUTES.PRODUCTS_CATALOG,
  ROUTES.DELIVERY_PAYMENT,
  ROUTES.RETURN_POLICY,
  ROUTES.USER_AGREEMENT,
  ROUTES.PERSONAL_DATA_NOTICE,
] as const;

//===================================================================

const ROBOTS_PRIVATE_ROUTE_ROOTS = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
  ROUTES.PROFILE,
  ...CLIENT_RESERVED_APP_PREFIXES.map((segment) => `/${segment}`),
] as const;

export const ROBOTS_DISALLOW_ROUTES = ROBOTS_PRIVATE_ROUTE_ROOTS.flatMap(
  (route) => [route, `${route}/`]
);

//===================================================================

export const SITEMAP_STATIC_ROUTES = SITEMAP_INDEXABLE_ROUTES;
