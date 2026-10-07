import type { Request } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';
import { serializeAdminAccess } from '../services/admin-access.service';

import type {
  AdminPharmacyDocumentParams,
  AdminPharmacyParams,
  UpdateAdminPharmacyStatusInput,
} from '../schemas/admin.schema';

import type {
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
  AdminPharmacyOwnerParams,
  AdminPharmacyOwnerPharmaciesQuery,
  UpdateAdminPharmacyOwnerStatusInput,
} from '../schemas/admin-pharmacy-owner.schema';

import type { AdminPharmacyOwnerDocumentParams } from '../schemas/pharmacy-owner-document.schema';

import type {
  ProductRequestModerationInput,
  ProductRequestParams,
} from '../schemas/product-request.schema';

import { updatePharmacyStatusByAdminService } from '../services/admin.service';
import { updatePharmacyOwnerStatusByAdminService } from '../services/pharmacy-owner-lifecycle.service';

import {
  getAdminPharmacyOwnerDetailService,
  getAdminPharmacyOwnerStatisticsService,
  listAdminPharmacyOwnerOptionsService,
  listAdminPharmacyOwnerPharmaciesService,
  listAdminPharmacyOwnersService,
} from '../services/admin-pharmacy-owner-read.service';

import { getAdminPharmacyDocumentContentService } from '../services/pharmacy-document.service';

import {
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
} from '../services/pharmacy-owner-document.service';

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

  const data = await getAdminPharmacyDocumentContentService(
    pharmacyId,
    documentId
  );

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
