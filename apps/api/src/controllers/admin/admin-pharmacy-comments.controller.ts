import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import type { AdminPharmacyParams } from '../../schemas/admin/admin.schema';

import {
  createPharmacyAdminCommentService,
  deletePharmacyAdminCommentService,
  listPharmacyAdminCommentsService,
} from '../../services/admin/pharmacies/pharmacy-admin-comment.service';

import type {
  CreatePharmacyAdminCommentInput,
  PharmacyAdminCommentParams,
} from '../../schemas/admin/pharmacies/pharmacy-admin-comment.schema';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

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
