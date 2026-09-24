import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

//===================================================================

export const adminApiRoutes = {
  adminAccess: {
    current: '/api/admin/access/me',
  },

  adminEmployees: {
    myProfile: '/api/admin/employees/me/profile',
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
    logoutAll: localAuthApiRoutes.logoutAll,
    password: localAuthApiRoutes.password,
    sessions: localAuthApiRoutes.sessions,
    session: localAuthApiRoutes.session,
    passwordResetRequest: localAuthApiRoutes.passwordResetRequest,
    passwordResetConfirm: localAuthApiRoutes.passwordResetConfirm,
  },
} as const;
