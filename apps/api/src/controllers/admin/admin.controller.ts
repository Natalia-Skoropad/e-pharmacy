import type { Request } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../../constants/admin/access/admin-access';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { serializeAdminAccess } from '../../services/admin/access/admin-access.service';

import type {
  AdminPharmacyParams,
  UpdateAdminPharmacyStatusInput,
  RequestAdminPharmacyCorrectionsInput,
  PharmacyModerationDecisionInput,
} from '../../schemas/admin/admin.schema';

import type {
  AdminPharmacyOwnerParams,
  UpdateAdminPharmacyOwnerStatusInput,
} from '../../schemas/admin/owners/admin-pharmacy-owner.schema';

import type {
  ProductRequestModerationInput,
  ProductRequestParams,
} from '../../schemas/catalog/product-request.schema';

import {
  requestPharmacyCorrectionsByAdminService,
  updatePharmacyStatusByAdminService,
  decidePharmacyModerationByAdminService,
} from '../../services/admin/pharmacies/admin.service';

import { updatePharmacyOwnerStatusByAdminService } from '../../services/owners/pharmacy-owner-lifecycle.service';
import { moderateProductRequestByAdminService } from '../../services/catalog/product-request-moderation.service';

import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/http/apiResponse';
import { httpError } from '../../utils/http/httpError';

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
