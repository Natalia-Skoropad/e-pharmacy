import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  AdminPharmacyDocumentParams,
  AdminPharmacyParams,
  UpdateAdminPharmacyStatusInput,
} from '../schemas/admin.schema';

import type { CreatePharmacyUserInput } from '../schemas/auth.schema';

import {
  createPharmacyUserByAdminService,
  updatePharmacyStatusByAdminService,
} from '../services/admin.service';

import { getAdminPharmacyDocumentContentService } from '../services/pharmacy-document.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

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
