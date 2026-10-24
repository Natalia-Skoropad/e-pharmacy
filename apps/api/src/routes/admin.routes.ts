import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';
import { ADMIN_PERMISSIONS } from '../constants/admin-permissions';

import {
  getCurrentAdminAccess,
  createPharmacyOwnerAdminCommentByAdmin,
  deletePharmacyOwnerAdminCommentByAdmin,
  downloadPharmacyOwnerDocumentByAdmin,
  getPharmacyOwnerDetailByAdmin,
  getPharmacyOwnerSummaryByAdmin,
  listPharmacyOwnerActivityByAdmin,
  listPharmacyActivityByAdmin,
  listPharmacyActivityActorsByAdmin,
  getPharmacyActivityDetailsByAdmin,
  listPharmacyOwnerDocumentsByAdmin,
  listPharmacyOwnerAdminCommentsByAdmin,
  listPharmacyOwnerOptionsByAdmin,
  listPharmacyOwnerPharmaciesByAdmin,
  listPharmacyOwnersByAdmin,
  listPharmaciesByAdmin,
  getPharmacyRegistryStatisticsByAdmin,
  listPharmacyRegistryOptionsByAdmin,
  listPharmacyRegistryOwnerOptionsByAdmin,
  getPharmacyDetailByAdmin,
  getPharmacySalesStatisticsByAdmin,
  getPharmacyOwnerSalesStatisticsByAdmin,
  getPharmacyOwnerSessionsByAdmin,
  listPharmacyDocumentsByAdmin,
  listPharmacyAdminCommentsByAdmin,
  createPharmacyAdminCommentByAdmin,
  deletePharmacyAdminCommentByAdmin,
  updatePharmacyOwnerStatusByAdmin,
  getAdminPharmacyDocument,
  updatePharmacyStatusByAdmin,
  decidePharmacyModerationByAdmin,
  requestPharmacyCorrectionsByAdmin,
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

import { authenticate } from '../middlewares/auth/auth.middleware';

import {
  requireAdminPermission,
  resolveAdminAuthorization,
} from '../middlewares/admin-permission.middleware';

import { authorizeRoles } from '../middlewares/auth/role.middleware';
import { validate } from '../middlewares/http/validate.middleware';

import {
  adminPharmacyDocumentParamsSchema,
  pharmacyIdParamsSchema,
  updateAdminPharmacyStatusSchema,
  pharmacyModerationDecisionSchema,
  requestAdminPharmacyCorrectionsSchema,
} from '../schemas/admin.schema';

import {
  adminPharmacyRegistryListQuerySchema,
  adminPharmacyRegistryOptionsQuerySchema,
} from '../schemas/admin-pharmacy-registry.schema';

import {
  adminPharmacyOwnerActivityQuerySchema,
  adminPharmacyOwnerListQuerySchema,
  adminPharmacyOwnerOptionsQuerySchema,
  adminPharmacyOwnerParamsSchema,
  adminPharmacyOwnerPharmaciesQuerySchema,
  updateAdminPharmacyOwnerStatusSchema,
} from '../schemas/admin-pharmacy-owner.schema';

import {
  adminEmployeeDocumentParamsSchema,
  adminEmployeeDocumentUploadSchema,
} from '../schemas/admin-employee-document.schema';

import { updateMyAdminEmployeeProfileSchema } from '../schemas/admin-employee-profile.schema';
import { adminPharmacyOwnerDocumentParamsSchema } from '../schemas/pharmacy-owner-document.schema';

import {
  createPharmacyAdminCommentSchema,
  pharmacyAdminCommentParamsSchema,
} from '../schemas/pharmacy-admin-comment.schema';

import {
  createPharmacyOwnerAdminCommentSchema,
  pharmacyOwnerAdminCommentParamsSchema,
} from '../schemas/pharmacy-owner-admin-comment.schema';

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
  adminPharmacyAuditLogParamsSchema,
} from '../schemas/admin-audit.schema';

import {
  productRequestModerationSchema,
  productRequestParamsSchema,
} from '../schemas/product-request.schema';

import { orderSalesStatisticsQuerySchema } from '../schemas/order.schema';
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

// Stage 14.4: read-only registry routes must precede the dynamic pharmacyId paths.
adminRoutes.get(
  '/pharmacies',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ query: adminPharmacyRegistryListQuerySchema }),
  ctrlWrapper(listPharmaciesByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/summary',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  ctrlWrapper(getPharmacyRegistryStatisticsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/options',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ query: adminPharmacyRegistryOptionsQuerySchema }),
  ctrlWrapper(listPharmacyRegistryOptionsByAdmin)
);

//=================================================================================

// Stage 14.10: pharmacy-scoped owner suggestions need pharmacies.view,
// not an additional, unrelated pharmacyOwners.view permission.
adminRoutes.get(
  '/pharmacies/owner-options',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ query: adminPharmacyRegistryOptionsQuerySchema }),
  ctrlWrapper(listPharmacyRegistryOwnerOptionsByAdmin)
);

//=================================================================================

// Stage 14.7: pharmacy activity is always exact-scoped on the backend;
// shared Audit handles the filters, pagination, action facets, and details.
adminRoutes.get(
  '/pharmacies/:pharmacyId/activity',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),

  validate({
    params: pharmacyIdParamsSchema,
    query: adminAuditListQuerySchema,
  }),

  ctrlWrapper(listPharmacyActivityByAdmin)
);

adminRoutes.get(
  '/pharmacies/:pharmacyId/activity/actors',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: pharmacyIdParamsSchema }),
  ctrlWrapper(listPharmacyActivityActorsByAdmin)
);

adminRoutes.get(
  '/pharmacies/:pharmacyId/activity/:auditLogId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: adminPharmacyAuditLogParamsSchema }),
  ctrlWrapper(getPharmacyActivityDetailsByAdmin)
);

//=================================================================================

// Stage 14.5: exact pharmacy detail, before documents and status mutations.
adminRoutes.get(
  '/pharmacies/:pharmacyId/sales-statistics',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),

  validate({
    params: pharmacyIdParamsSchema,
    query: orderSalesStatisticsQuerySchema,
  }),

  ctrlWrapper(getPharmacySalesStatisticsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/:pharmacyId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: pharmacyIdParamsSchema }),
  ctrlWrapper(getPharmacyDetailByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ query: adminPharmacyOwnerListQuerySchema }),
  ctrlWrapper(listPharmacyOwnersByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/summary',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  ctrlWrapper(getPharmacyOwnerSummaryByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/options',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ query: adminPharmacyOwnerOptionsQuerySchema }),
  ctrlWrapper(listPharmacyOwnerOptionsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ params: adminPharmacyOwnerParamsSchema }),
  ctrlWrapper(getPharmacyOwnerDetailByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/sessions',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ params: adminPharmacyOwnerParamsSchema }),
  ctrlWrapper(getPharmacyOwnerSessionsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/sales-statistics',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),

  validate({
    params: adminPharmacyOwnerParamsSchema,
    query: orderSalesStatisticsQuerySchema,
  }),

  ctrlWrapper(getPharmacyOwnerSalesStatisticsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/pharmacies',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),

  validate({
    params: adminPharmacyOwnerParamsSchema,
    query: adminPharmacyOwnerPharmaciesQuerySchema,
  }),

  ctrlWrapper(listPharmacyOwnerPharmaciesByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/activity',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),

  validate({
    params: adminPharmacyOwnerParamsSchema,
    query: adminPharmacyOwnerActivityQuerySchema,
  }),

  ctrlWrapper(listPharmacyOwnerActivityByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/documents',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ params: adminPharmacyOwnerParamsSchema }),
  ctrlWrapper(listPharmacyOwnerDocumentsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/documents/:documentId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ params: adminPharmacyOwnerDocumentParamsSchema }),
  ctrlWrapper(downloadPharmacyOwnerDocumentByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacy-owners/:ownerId/comments',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.view),
  validate({ params: adminPharmacyOwnerParamsSchema }),
  ctrlWrapper(listPharmacyOwnerAdminCommentsByAdmin)
);

//=================================================================================

adminRoutes.post(
  '/pharmacy-owners/:ownerId/comments',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.edit),

  validate({
    params: adminPharmacyOwnerParamsSchema,
    body: createPharmacyOwnerAdminCommentSchema,
  }),

  ctrlWrapper(createPharmacyOwnerAdminCommentByAdmin)
);

//=================================================================================

adminRoutes.delete(
  '/pharmacy-owners/:ownerId/comments/:commentId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacyOwners.edit),
  validate({ params: pharmacyOwnerAdminCommentParamsSchema }),
  ctrlWrapper(deletePharmacyOwnerAdminCommentByAdmin)
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

// Stage 14.6: documents are read-only and always pharmacy-scoped.
adminRoutes.get(
  '/pharmacies/:pharmacyId/documents',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: pharmacyIdParamsSchema }),
  ctrlWrapper(listPharmacyDocumentsByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/:pharmacyId/comments',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: pharmacyIdParamsSchema }),
  ctrlWrapper(listPharmacyAdminCommentsByAdmin)
);

//=================================================================================

adminRoutes.post(
  '/pharmacies/:pharmacyId/comments',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.edit),

  validate({
    params: pharmacyIdParamsSchema,
    body: createPharmacyAdminCommentSchema,
  }),

  ctrlWrapper(createPharmacyAdminCommentByAdmin)
);

//=================================================================================

adminRoutes.delete(
  '/pharmacies/:pharmacyId/comments/:commentId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.edit),
  validate({ params: pharmacyAdminCommentParamsSchema }),
  ctrlWrapper(deletePharmacyAdminCommentByAdmin)
);

//=================================================================================

adminRoutes.get(
  '/pharmacies/:pharmacyId/documents/:documentId',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view),
  validate({ params: adminPharmacyDocumentParamsSchema }),
  ctrlWrapper(getAdminPharmacyDocument)
);

//=================================================================================

adminRoutes.post(
  '/pharmacies/:pharmacyId/moderation-decisions',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.moderate),

  validate({
    params: pharmacyIdParamsSchema,
    body: pharmacyModerationDecisionSchema,
  }),

  ctrlWrapper(decidePharmacyModerationByAdmin)
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

adminRoutes.post(
  '/pharmacies/:pharmacyId/review/corrections',
  requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.moderate),

  validate({
    params: pharmacyIdParamsSchema,
    body: requestAdminPharmacyCorrectionsSchema,
  }),

  ctrlWrapper(requestPharmacyCorrectionsByAdmin)
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
