import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

//===================================================================

export const adminApiRoutes = {
  auth: {
    current: localAuthApiRoutes.current,
    logout: localAuthApiRoutes.logout,
  },
} as const;
