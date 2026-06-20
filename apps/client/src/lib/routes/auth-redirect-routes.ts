import { ROUTES } from './routes';

//===================================================================

export const CLIENT_ALLOWED_REDIRECT_PREFIXES = [
  ROUTES.PROFILE,
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.PRODUCTS_CATALOG,
  ROUTES.PHARMACIES,
] as const;
