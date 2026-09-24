import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

//===================================================================

export const adminApiRoutes = {
  adminAccess: {
    current: '/api/admin/access/me',
  },

  audit: {
    list: '/api/admin/audit',
    details: (auditLogId: string) =>
      `/api/admin/audit/${encodeURIComponent(auditLogId)}`,
  },

  auth: {
    current: localAuthApiRoutes.current,
    logout: localAuthApiRoutes.logout,
  },
} as const;
