import { ROUTES } from '../routes/client-routes';

//===================================================================

export const INDEXABLE_ROUTES = [
  ROUTES.HOME,
  ROUTES.PHARMACIES,
  ROUTES.PRODUCTS_CATALOG,
  ROUTES.DELIVERY_PAYMENT,
  ROUTES.RETURN_POLICY,
  ROUTES.USER_AGREEMENT,
  ROUTES.PERSONAL_DATA_NOTICE,
] as const;

//===================================================================

export const NOINDEX_ROUTES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  `${ROUTES.CHECKOUT}/:path*`,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
  ROUTES.PROFILE,
  `${ROUTES.PROFILE}/:path*`,
  '/admin',
  '/admin/:path*',
  '/pharmacy',
  '/pharmacy/:path*',
] as const;

//===================================================================

export const ROBOTS_PRIVATE_ROUTE_ROOTS = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
  ROUTES.PROFILE,
  ROUTES.ADMIN,
  ROUTES.PHARMACY,
] as const;

export const ROBOTS_DISALLOW_ROUTES = ROBOTS_PRIVATE_ROUTE_ROOTS.flatMap(
  (route) => [route, `${route}/`]
);

//===================================================================

export const SITEMAP_STATIC_ROUTES = INDEXABLE_ROUTES;
