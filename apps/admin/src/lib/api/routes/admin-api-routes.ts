import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

//===================================================================

export const adminApiRoutes = {
  adminAccess: {
    current: '/api/admin/access/me',
  },

  adminEmployees: {
    myProfile: '/api/admin/employees/me/profile',
    myDocuments: '/api/admin/employees/me/documents',

    myDocument: (documentId: string) =>
      `/api/admin/employees/me/documents/${encodeURIComponent(documentId)}`,

    myComments: '/api/admin/employees/me/comments',

    myComment: (commentId: string) =>
      `/api/admin/employees/me/comments/${encodeURIComponent(commentId)}`,
  },

  pharmacyOwners: {
    list: '/api/admin/pharmacy-owners',
    summary: '/api/admin/pharmacy-owners/summary',
    options: '/api/admin/pharmacy-owners/options',

    details: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}`,

    status: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/status`,

    pharmacies: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/pharmacies`,

    documents: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/documents`,

    document: (ownerId: string, documentId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/documents/${encodeURIComponent(documentId)}`,

    comments: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/comments`,

    comment: (ownerId: string, commentId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/comments/${encodeURIComponent(commentId)}`,

    activity: (ownerId: string) =>
      `/api/admin/pharmacy-owners/${encodeURIComponent(ownerId)}/activity`,
  },

  productCategories: {
    list: '/api/admin/product-categories',
    details: (categoryId: string) =>
      `/api/admin/product-categories/${encodeURIComponent(categoryId)}`,
  },

  positions: {
    list: '/api/admin/positions',
    details: (positionId: string) =>
      `/api/admin/positions/${encodeURIComponent(positionId)}`,
  },

  audit: {
    list: '/api/admin/audit',
    actors: '/api/admin/audit/actors',
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
