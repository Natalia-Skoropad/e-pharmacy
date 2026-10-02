import { Router } from 'express';
import { USER_ROLES } from '../constants/auth';
import { ADMIN_PERMISSIONS } from '../constants/admin-permissions';

import {
  getCurrentAdminAccess,
  updatePharmacyOwnerStatusByAdmin,
  getAdminPharmacyDocument,
  updatePharmacyStatusByAdmin,
  updateProductRequestStatusByAdmin,
} from '../controllers/admin.controller';

import {
  createMyAdminEmployeeDocument,
  createMyAdminEmployeePrivateNote,
  deleteMyAdminEmployeeDocument,
  deleteMyAdminEmployeePrivateNote,
  getMyAdminEmployeeDocument,
  listMyAdminEmployeeDocuments,
  listMyAdminEmployeePrivateNotes,
  replaceMyAdminEmployeeDocument,
  updateMyAdminEmployeeProfile,
} from '../controllers/admin-employee.controller';

import {
  createAdminPosition,
  createAdminProductCategory,
  deleteAdminPosition,
  deleteAdminProductCategory,
  listAdminPositions,
  listAdminProductCategories,
  updateAdminPosition,
  updateAdminProductCategory,
} from '../controllers/admin-settings.controller';

import {
  getAdminAuditActors,
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

import {
  adminPharmacyOwnerParamsSchema,
  updateAdminPharmacyOwnerStatusSchema,
} from '../schemas/admin-pharmacy-owner.schema';

import {
  adminEmployeeDocumentParamsSchema,
  adminEmployeeDocumentUploadSchema,
} from '../schemas/admin-employee-document.schema';

import { updateMyAdminEmployeeProfileSchema } from '../schemas/admin-employee-profile.schema';

import {
  adminEmployeePrivateNoteParamsSchema,
  adminEmployeePrivateNotesQuerySchema,
  createAdminEmployeePrivateNoteSchema,
} from '../schemas/admin-employee-note.schema';

import {
  adminPositionParamsSchema,
  adminProductCategoryParamsSchema,
  adminSettingsDictionaryListQuerySchema,
  createAdminProductCategorySchema,
  createAdminSettingsDictionaryItemSchema,
  updateAdminProductCategorySchema,
  updateAdminSettingsDictionaryItemSchema,
} from '../schemas/admin-settings.schema';

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
  '/employees/me/documents',
  ctrlWrapper(listMyAdminEmployeeDocuments)
);

//=================================================================================

adminRoutes.get(
  '/employees/me/documents/:documentId',
  validate({ params: adminEmployeeDocumentParamsSchema }),
  ctrlWrapper(getMyAdminEmployeeDocument)
);

//=================================================================================

adminRoutes.post(
  '/employees/me/documents',
  validate({ body: adminEmployeeDocumentUploadSchema }),
  ctrlWrapper(createMyAdminEmployeeDocument)
);

//=================================================================================

adminRoutes.put(
  '/employees/me/documents/:documentId',

  validate({
    params: adminEmployeeDocumentParamsSchema,
    body: adminEmployeeDocumentUploadSchema,
  }),

  ctrlWrapper(replaceMyAdminEmployeeDocument)
);

//=================================================================================

adminRoutes.delete(
  '/employees/me/documents/:documentId',
  validate({ params: adminEmployeeDocumentParamsSchema }),
  ctrlWrapper(deleteMyAdminEmployeeDocument)
);

//=================================================================================

adminRoutes.get(
  '/employees/me/comments',
  validate({ query: adminEmployeePrivateNotesQuerySchema }),
  ctrlWrapper(listMyAdminEmployeePrivateNotes)
);

//=================================================================================

adminRoutes.post(
  '/employees/me/comments',
  validate({ body: createAdminEmployeePrivateNoteSchema }),
  ctrlWrapper(createMyAdminEmployeePrivateNote)
);

//=================================================================================

adminRoutes.delete(
  '/employees/me/comments/:commentId',
  validate({ params: adminEmployeePrivateNoteParamsSchema }),
  ctrlWrapper(deleteMyAdminEmployeePrivateNote)
);

//=================================================================================

adminRoutes.get(
  '/product-categories',
  requireAdminPermission(ADMIN_PERMISSIONS.categories.view),
  validate({ query: adminSettingsDictionaryListQuerySchema }),
  ctrlWrapper(listAdminProductCategories)
);

//=================================================================================

adminRoutes.post(
  '/product-categories',
  requireAdminPermission(ADMIN_PERMISSIONS.categories.create),
  validate({ body: createAdminProductCategorySchema }),
  ctrlWrapper(createAdminProductCategory)
);

//=================================================================================

adminRoutes.patch(
  '/product-categories/:categoryId',
  requireAdminPermission(ADMIN_PERMISSIONS.categories.edit),

  validate({
    params: adminProductCategoryParamsSchema,
    body: updateAdminProductCategorySchema,
  }),

  ctrlWrapper(updateAdminProductCategory)
);

//=================================================================================

adminRoutes.delete(
  '/product-categories/:categoryId',
  requireAdminPermission(ADMIN_PERMISSIONS.categories.delete),
  validate({ params: adminProductCategoryParamsSchema }),
  ctrlWrapper(deleteAdminProductCategory)
);

//=================================================================================

adminRoutes.get(
  '/positions',
  requireAdminPermission(ADMIN_PERMISSIONS.positions.view),
  validate({ query: adminSettingsDictionaryListQuerySchema }),
  ctrlWrapper(listAdminPositions)
);

//=================================================================================

adminRoutes.post(
  '/positions',
  requireAdminPermission(ADMIN_PERMISSIONS.positions.create),
  validate({ body: createAdminSettingsDictionaryItemSchema }),
  ctrlWrapper(createAdminPosition)
);

//=================================================================================

adminRoutes.patch(
  '/positions/:positionId',
  requireAdminPermission(ADMIN_PERMISSIONS.positions.edit),

  validate({
    params: adminPositionParamsSchema,
    body: updateAdminSettingsDictionaryItemSchema,
  }),

  ctrlWrapper(updateAdminPosition)
);

//=================================================================================

adminRoutes.delete(
  '/positions/:positionId',
  requireAdminPermission(ADMIN_PERMISSIONS.positions.delete),
  validate({ params: adminPositionParamsSchema }),
  ctrlWrapper(deleteAdminPosition)
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
  '/audit/actors',
  requireAdminPermission(ADMIN_PERMISSIONS.audit.view),
  ctrlWrapper(getAdminAuditActors)
);

//=================================================================================

adminRoutes.get(
  '/audit/:auditLogId',
  requireAdminPermission(ADMIN_PERMISSIONS.audit.view),
  validate({ params: adminAuditLogParamsSchema }),
  ctrlWrapper(getAdminAuditLogDetails)
);

//=================================================================================

adminRoutes.patch(
  '/pharmacy-owners/:ownerId/status',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.edit),

  validate({
    params: adminPharmacyOwnerParamsSchema,
    body: updateAdminPharmacyOwnerStatusSchema,
  }),

  ctrlWrapper(updatePharmacyOwnerStatusByAdmin)
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
