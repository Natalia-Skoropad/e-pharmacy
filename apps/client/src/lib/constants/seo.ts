import { ROUTES } from './routes';

//===================================================================

export const INDEXABLE_ROUTES = [
  ROUTES.HOME,
  ROUTES.STORES,
  ROUTES.MEDICINES_CATALOG,
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
  '/vendor',
  '/vendor/:path*',
] as const;

//===================================================================

export const ROBOTS_DISALLOW_ROUTES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
  ROUTES.PROFILE,
  '/admin',
  '/vendor',
] as const;

//===================================================================

export const SITEMAP_STATIC_ROUTES = INDEXABLE_ROUTES;
