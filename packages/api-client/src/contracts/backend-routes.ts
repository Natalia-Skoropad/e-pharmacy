import { authRoutes } from './auth-routes';
import { backendRoutes } from './backend-resource-routes';

//===================================================================

export const apiRoutes = {
  ...backendRoutes,
  auth: authRoutes,
} as const;
