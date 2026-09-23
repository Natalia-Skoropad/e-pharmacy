import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

//===================================================================

export const adminApiRoutes = {
  adminAccess: {
    current: '/api/admin/access/me',
  },

  auth: {
    current: localAuthApiRoutes.current,
    logout: localAuthApiRoutes.logout,
  },
} as const;
