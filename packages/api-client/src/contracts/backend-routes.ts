import { authRoutes } from './auth-routes';
import { storefrontRoutes } from './storefront-routes';

//===================================================================

export const API_HEADERS = {
  json: {
    'Content-Type': 'application/json',
  },
} as const;

//===================================================================

export const apiRoutes = {
  ...storefrontRoutes,
  auth: authRoutes,
} as const;
