import { ROUTES } from './routes';

//===================================================================

export const CLIENT_PRIVATE_ROUTE_PREFIXES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.PROFILE,
] as const;

export const CLIENT_GUEST_PREFERRED_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
] as const;

//===================================================================

export const CLIENT_TOKEN_ACCESS_ROUTES = [ROUTES.RESET_PASSWORD] as const;
