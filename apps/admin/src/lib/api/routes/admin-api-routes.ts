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
    login: localAuthApiRoutes.login,
    logout: localAuthApiRoutes.logout,
    passwordResetRequest: localAuthApiRoutes.passwordResetRequest,
    passwordResetConfirm: localAuthApiRoutes.passwordResetConfirm,
  },
} as const;
