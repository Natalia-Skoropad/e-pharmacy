import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import type { AdminPharmacyOwnerParams } from '../../schemas/admin/owners/admin-pharmacy-owner.schema';

import type {
  CreatePharmacyOwnerAdminCommentInput,
  PharmacyOwnerAdminCommentParams,
} from '../../schemas/owners/pharmacy-owner-admin-comment.schema';

import {
  createPharmacyOwnerAdminCommentService,
  deletePharmacyOwnerAdminCommentService,
  listPharmacyOwnerAdminCommentsService,
} from '../../services/admin/owners/pharmacy-owner-admin-comment.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

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
