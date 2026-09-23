import { Router } from 'express';
import { USER_ROLES } from '../constants/auth';
import { ADMIN_PERMISSIONS } from '../constants/admin-permissions';

import {
  createPharmacyUserByAdmin,
  getCurrentAdminAccess,
  getAdminPharmacyDocument,
  updatePharmacyStatusByAdmin,
  updateProductRequestStatusByAdmin,
} from '../controllers/admin.controller';

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

import { createPharmacyUserSchema } from '../schemas/auth.schema';

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

adminRoutes.post(
  '/pharmacies',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.edit),
  validate({ body: createPharmacyUserSchema }),
  ctrlWrapper(createPharmacyUserByAdmin)
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
