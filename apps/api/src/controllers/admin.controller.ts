import type { Request } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';
import { serializeAdminAccess } from '../services/admin-access.service';

import type {
  AdminPharmacyDocumentParams,
  AdminPharmacyParams,
  UpdateAdminPharmacyStatusInput,
} from '../schemas/admin.schema';

import type { CreatePharmacyUserInput } from '../schemas/auth.schema';

import type {
  ProductRequestModerationInput,
  ProductRequestParams,
} from '../schemas/product-request.schema';

import {
  createPharmacyUserByAdminService,
  updatePharmacyStatusByAdminService,
} from '../services/admin.service';

import { getAdminPharmacyDocumentContentService } from '../services/pharmacy-document.service';
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

export async function createPharmacyUserByAdmin(
  req: Request,
  res: ValidatedResponse<CreatePharmacyUserInput>
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const pharmacy = await createPharmacyUserByAdminService(
    res.locals.validated.body,
    adminUserId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Pharmacy was created successfully.',
    data: { pharmacy },
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
    adminUserId
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

  const { requestId } = res.locals.validated.params;

  const data = await moderateProductRequestByAdminService(
    requestId,
    res.locals.validated.body,
    adminUserId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Product request status was updated successfully.',
    data,
  });
}
