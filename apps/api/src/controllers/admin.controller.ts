import type { Request } from 'express';

import type { AdminAuditListQuery } from '../schemas/admin-audit.schema';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';
import { serializeAdminAccess } from '../services/admin-access.service';

import type {
  AdminPharmacyDocumentParams,
  AdminPharmacyParams,
  UpdateAdminPharmacyStatusInput,
  RequestAdminPharmacyCorrectionsInput,
  PharmacyModerationDecisionInput,
} from '../schemas/admin.schema';

import type {
  AdminPharmacyRegistryListQuery,
  AdminPharmacyRegistryOptionsQuery,
} from '../schemas/admin-pharmacy-registry.schema';

import type {
  AdminPharmacyOwnerActivityQuery,
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
  AdminPharmacyOwnerParams,
  AdminPharmacyOwnerPharmaciesQuery,
  UpdateAdminPharmacyOwnerStatusInput,
} from '../schemas/admin-pharmacy-owner.schema';

import type { AdminPharmacyOwnerDocumentParams } from '../schemas/pharmacy-owner-document.schema';

import type {
  CreatePharmacyOwnerAdminCommentInput,
  PharmacyOwnerAdminCommentParams,
} from '../schemas/pharmacy-owner-admin-comment.schema';

import type {
  ProductRequestModerationInput,
  ProductRequestParams,
} from '../schemas/product-request.schema';

import {
  requestPharmacyCorrectionsByAdminService,
  updatePharmacyStatusByAdminService,
  decidePharmacyModerationByAdminService,
} from '../services/admin.service';

import { updatePharmacyOwnerStatusByAdminService } from '../services/pharmacy-owner-lifecycle.service';

import {
  getAdminPharmacyOwnerDetailService,
  getAdminPharmacyOwnerStatisticsService,
  listAdminPharmacyOwnerActivityService,
  listAdminPharmacyOwnerOptionsService,
  listAdminPharmacyOwnerPharmaciesService,
  listAdminPharmacyOwnersService,
} from '../services/admin-pharmacy-owner-read.service';

import {
  listAdminPharmaciesService,
  getAdminPharmacyStatisticsService,
  listAdminPharmacyOptionsService,
  listAdminPharmacyRegistryOwnerOptionsService,
} from '../services/admin-pharmacy-registry-read.service';

import {
  getAdminPharmacyDetailService,
  getAdminPharmacySalesStatisticsService,
} from '../services/admin-pharmacy-detail-read.service';

import type { OrderSalesStatisticsQuery } from '../schemas/order.schema';

import {
  getAdminPharmacyActivityDetailsService,
  listAdminPharmacyActivityActorsService,
  listAdminPharmacyActivityService,
} from '../services/admin-pharmacy-activity.service';

import {
  downloadAdminPharmacyDocumentService,
  listAdminPharmacyDocumentsService,
} from '../services/pharmacy-document.service';

import {
  createPharmacyAdminCommentService,
  deletePharmacyAdminCommentService,
  listPharmacyAdminCommentsService,
} from '../services/pharmacy-admin-comment.service';

import type {
  CreatePharmacyAdminCommentInput,
  PharmacyAdminCommentParams,
} from '../schemas/pharmacy-admin-comment.schema';

import {
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
} from '../services/pharmacy-owner-document.service';

import {
  createPharmacyOwnerAdminCommentService,
  deletePharmacyOwnerAdminCommentService,
  listPharmacyOwnerAdminCommentsService,
} from '../services/pharmacy-owner-admin-comment.service';

import { moderateProductRequestByAdminService } from '../services/product-request.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';
import { httpError } from '../utils/httpError';

//===============================================================

export async function getCurrentAdminAccess(
  req: Request,
  res: ValidatedResponse<unknown>
): Promise<void> {
  const authorization = req.adminAuthorization;

  if (!authorization) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access is required.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { access: serializeAdminAccess(authorization) },
  });
}

//===============================================================

export async function getAdminPharmacyDocument(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyDocumentParams>
): Promise<void> {
  const { pharmacyId, documentId } = res.locals.validated.params;

  const { document, content } = await downloadAdminPharmacyDocumentService(
    pharmacyId,
    documentId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(document.name).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )}`
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function listPharmacyDocumentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const documents = await listAdminPharmacyDocumentsService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { documents } });
}

//===============================================================

export async function listPharmacyAdminCommentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const comments = await listPharmacyAdminCommentsService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { comments } });
}

//===============================================================

export async function createPharmacyAdminCommentByAdmin(
  req: Request,
  res: ValidatedResponse<CreatePharmacyAdminCommentInput, AdminPharmacyParams>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;
  const requestId = res.locals.requestId;

  if (!requestId)
    throw new Error('Request id is required for pharmacy comment audit.');

  const comment = await createPharmacyAdminCommentService(
    res.locals.validated.params.pharmacyId,
    adminUserId,
    res.locals.validated.body,
    requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Pharmacy admin comment was created successfully.',
    data: { comment },
  });
}

//===============================================================

export async function deletePharmacyAdminCommentByAdmin(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyAdminCommentParams>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;
  const requestId = res.locals.requestId;

  if (!requestId)
    throw new Error('Request id is required for pharmacy comment audit.');

  const { pharmacyId, commentId } = res.locals.validated.params;

  await deletePharmacyAdminCommentService(
    pharmacyId,
    commentId,
    adminUserId,
    requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

//===============================================================

export async function listPharmaciesByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryListQuery>
): Promise<void> {
  const data = await listAdminPharmaciesService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyRegistryStatisticsByAdmin(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getAdminPharmacyStatisticsService();

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyRegistryOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyRegistryOwnerOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyRegistryOwnerOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacySalesStatisticsByAdmin(
  _req: Request,
  res: ValidatedResponse<
    unknown,
    AdminPharmacyParams,
    OrderSalesStatisticsQuery
  >
): Promise<void> {
  const data = await getAdminPharmacySalesStatisticsService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyDetailByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const data = await getAdminPharmacyDetailService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnersByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyOwnerListQuery>
): Promise<void> {
  const data = await listAdminPharmacyOwnersService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOwnerSummaryByAdmin(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getAdminPharmacyOwnerStatisticsService();

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnerOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyOwnerOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyOwnerOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOwnerDetailByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const data = await getAdminPharmacyOwnerDetailService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnerPharmaciesByAdmin(
  _req: Request,
  res: ValidatedResponse<
    unknown,
    AdminPharmacyOwnerParams,
    AdminPharmacyOwnerPharmaciesQuery
  >
): Promise<void> {
  const data = await listAdminPharmacyOwnerPharmaciesService(
    res.locals.validated.params.ownerId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyActivityByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams, AdminAuditListQuery>
): Promise<void> {
  const data = await listAdminPharmacyActivityService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyActivityActorsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const data = await listAdminPharmacyActivityActorsService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyActivityDetailsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, { pharmacyId: string; auditLogId: string }>
): Promise<void> {
  const auditLog = await getAdminPharmacyActivityDetailsService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.params.auditLogId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { auditLog } });
}

//===============================================================

export async function listPharmacyOwnerActivityByAdmin(
  _req: Request,
  res: ValidatedResponse<
    unknown,
    AdminPharmacyOwnerParams,
    AdminPharmacyOwnerActivityQuery
  >
): Promise<void> {
  const data = await listAdminPharmacyOwnerActivityService(
    res.locals.validated.params.ownerId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnerDocumentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const documents = await listPharmacyOwnerDocumentsService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { documents },
  });
}

//===============================================================

export async function downloadPharmacyOwnerDocumentByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerDocumentParams>
): Promise<void> {
  const { ownerId, documentId } = res.locals.validated.params;

  const { document, content } = await getPharmacyOwnerDocumentContentService(
    ownerId,
    documentId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(document.name).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )}`
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function listPharmacyOwnerAdminCommentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const comments = await listPharmacyOwnerAdminCommentsService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { comments },
  });
}

//===============================================================

export async function createPharmacyOwnerAdminCommentByAdmin(
  req: Request,
  res: ValidatedResponse<
    CreatePharmacyOwnerAdminCommentInput,
    AdminPharmacyOwnerParams
  >
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const requestId = res.locals.requestId;

  if (!requestId) {
    throw new Error('Request id is required for owner comment audit.');
  }

  const comment = await createPharmacyOwnerAdminCommentService(
    res.locals.validated.params.ownerId,
    adminUserId,
    res.locals.validated.body,
    requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Owner comment was created successfully.',
    data: { comment },
  });
}

//===============================================================

export async function deletePharmacyOwnerAdminCommentByAdmin(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyOwnerAdminCommentParams>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const requestId = res.locals.requestId;

  if (!requestId) {
    throw new Error('Request id is required for owner comment audit.');
  }

  const { ownerId, commentId } = res.locals.validated.params;

  await deletePharmacyOwnerAdminCommentService(
    ownerId,
    commentId,
    adminUserId,
    requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

//===============================================================

export async function updatePharmacyOwnerStatusByAdmin(
  req: Request,
  res: ValidatedResponse<
    UpdateAdminPharmacyOwnerStatusInput,
    AdminPharmacyOwnerParams
  >
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const { ownerId } = res.locals.validated.params;
  const requestId = res.locals.requestId;

  if (!requestId) {
    throw new Error('Request id is required for owner lifecycle audit.');
  }

  const owner = await updatePharmacyOwnerStatusByAdminService(
    ownerId,
    res.locals.validated.body,
    adminUserId,
    requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy owner status was updated successfully.',
    data: { owner },
  });
}

//===============================================================

export async function decidePharmacyModerationByAdmin(
  req: Request,
  res: ValidatedResponse<PharmacyModerationDecisionInput, AdminPharmacyParams>
): Promise<void> {
  if (!req.user?.id) return;

  const pharmacy = await decidePharmacyModerationByAdminService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body,
    req.user.id,
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy moderation decision was applied successfully.',
    data: { pharmacy },
  });
}

//===============================================================

export async function updatePharmacyStatusByAdmin(
  req: Request,
  res: ValidatedResponse<UpdateAdminPharmacyStatusInput, AdminPharmacyParams>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const { pharmacyId } = res.locals.validated.params;

  const pharmacy = await updatePharmacyStatusByAdminService(
    pharmacyId,
    res.locals.validated.body,
    adminUserId,
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy status was updated successfully.',
    data: { pharmacy },
  });
}

//===============================================================

export async function requestPharmacyCorrectionsByAdmin(
  req: Request,
  res: ValidatedResponse<
    RequestAdminPharmacyCorrectionsInput,
    AdminPharmacyParams
  >
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const pharmacy = await requestPharmacyCorrectionsByAdminService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body,
    adminUserId,
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Corrections were requested successfully.',
    data: { pharmacy },
  });
}

//===============================================================

export async function updateProductRequestStatusByAdmin(
  req: Request,
  res: ValidatedResponse<ProductRequestModerationInput, ProductRequestParams>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const { requestId: productRequestId } = res.locals.validated.params;

  const data = await moderateProductRequestByAdminService(
    productRequestId,
    res.locals.validated.body,
    adminUserId,
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Product request status was updated successfully.',
    data,
  });
}
