import { Router } from 'express';
import { USER_ROLES } from '../constants/auth';
import { ADMIN_PERMISSIONS } from '../constants/admin-permissions';

import {
  getCurrentAdminAccess,
  getAdminPharmacyDocument,
  updatePharmacyStatusByAdmin,
  updateProductRequestStatusByAdmin,
} from '../controllers/admin.controller';

import { updateMyAdminEmployeeProfile } from '../controllers/admin-employee.controller';

import {
  getAdminAuditLogDetails,
  getAdminAuditLogs,
} from '../controllers/admin-audit.controller';

import { authenticate } from '../middlewares/auth.middleware';

import {
  requireAdminPermission,
  resolveAdminAuthorization,
} from '../middlewares/admin-permission.middleware';

import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  adminPharmacyDocumentParamsSchema,
  pharmacyIdParamsSchema,
  updateAdminPharmacyStatusSchema,
} from '../schemas/admin.schema';

import { updateMyAdminEmployeeProfileSchema } from '../schemas/admin-employee-profile.schema';

import {
  adminAuditListQuerySchema,
  adminAuditLogParamsSchema,
} from '../schemas/admin-audit.schema';

import {
  productRequestModerationSchema,
  productRequestParamsSchema,
} from '../schemas/product-request.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//=================================================================================

export const adminRoutes = Router();

//=================================================================================

adminRoutes.use(
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  resolveAdminAuthorization
);

//=================================================================================

adminRoutes.get('/access/me', ctrlWrapper(getCurrentAdminAccess));

//=================================================================================

adminRoutes.patch(
  '/employees/me/profile',
  validate({ body: updateMyAdminEmployeeProfileSchema }),
  ctrlWrapper(updateMyAdminEmployeeProfile)
);

//=================================================================================

adminRoutes.get(
  '/audit',
  requireAdminPermission(ADMIN_PERMISSIONS.audit.view),
  validate({ query: adminAuditListQuerySchema }),
  ctrlWrapper(getAdminAuditLogs)
);

//=================================================================================

adminRoutes.get(
  '/audit/:auditLogId',
  requireAdminPermission(ADMIN_PERMISSIONS.audit.view),
  validate({ params: adminAuditLogParamsSchema }),
  ctrlWrapper(getAdminAuditLogDetails)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/:pharmacyId/documents/:documentId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: adminPharmacyDocumentParamsSchema }),
  ctrlWrapper(getAdminPharmacyDocument)
);

//=================================================================================

adminRoutes.patch(
  '/pharmacies/:pharmacyId/status',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.moderate),

  validate({
    params: pharmacyIdParamsSchema,
    body: updateAdminPharmacyStatusSchema,
  }),

  ctrlWrapper(updatePharmacyStatusByAdmin)
);

//=================================================================================

adminRoutes.patch(
  '/product-requests/:requestId/status',
  requireAdminPermission(ADMIN_PERMISSIONS.productRequests.moderate),

  validate({
    params: productRequestParamsSchema,
    body: productRequestModerationSchema,
  }),

  ctrlWrapper(updateProductRequestStatusByAdmin)
);
