import { ROUTES } from './routes';

//===================================================================

export const INDEXABLE_ROUTES = [
  ROUTES.HOME,
  ROUTES.STORES,
  ROUTES.MEDICINE_STORE,
] as const;

//===================================================================

export const NOINDEX_ROUTES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PROFILE,
] as const;

//===================================================================

export const SITEMAP_STATIC_ROUTES = INDEXABLE_ROUTES;
export const ROBOTS_DISALLOW_ROUTES = NOINDEX_ROUTES;
