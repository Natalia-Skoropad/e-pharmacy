import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { ProductRequest } from '../../models/catalog/productRequest.model';

import { httpError } from '../../utils/http/httpError';
import { sendSuccessResponse } from '../../utils/http/apiResponse';
import type { ValidatedResponse } from '../../types/http/validated-request';

import type { AdminAuditListQuery } from '../../schemas/admin/audit/admin-audit.schema';
import type { CreatePharmacyAdminCommentInput } from '../../schemas/admin/pharmacies/pharmacy-admin-comment.schema';

import {
  listProductRequestAdminCommentsService,
  createProductRequestAdminCommentService,
  deleteProductRequestAdminCommentService,
} from '../../services/admin/catalog/product-request-admin-comment.service';

import {
  listAdminAuditLogsService,
  getAdminAuditLogService,
} from '../../services/admin/audit/admin-audit-read.service';

import { listAdminAuditActorsService } from '../../services/admin/audit/admin-audit-actors.service';

//===============================================================

type Params = { requestId: string };

//===============================================================

async function assertRequest(requestId: string) {
  if (!(await ProductRequest.exists({ _id: requestId })))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
}

//===============================================================

export async function listRequestAdminComments(
  _req: Request,
  res: ValidatedResponse<unknown, Params>
) {
  const comments = await listProductRequestAdminCommentsService(
    res.locals.validated.params.requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { comments } });
}

//===============================================================

export async function createRequestAdminComment(
  req: Request,
  res: ValidatedResponse<CreatePharmacyAdminCommentInput, Params>
) {
  if (!req.user?.id)
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account is required.');

  if (!res.locals.requestId)
    throw new Error('Request id is required for audit.');

  const comment = await createProductRequestAdminCommentService(
    res.locals.validated.params.requestId,
    req.user.id,
    res.locals.validated.body,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data: { comment },
  });
}

//===============================================================

export async function deleteRequestAdminComment(
  req: Request,
  res: ValidatedResponse<unknown, Params & { commentId: string }>
) {
  if (!req.user?.id)
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account is required.');

  if (!res.locals.requestId)
    throw new Error('Request id is required for audit.');

  const { requestId, commentId } = res.locals.validated.params;

  await deleteProductRequestAdminCommentService(
    requestId,
    commentId,
    req.user.id,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

//===============================================================

export async function listRequestActivity(
  _req: Request,
  res: ValidatedResponse<unknown, Params, AdminAuditListQuery>
) {
  const { requestId } = res.locals.validated.params;

  await assertRequest(requestId);

  const data = await listAdminAuditLogsService(res.locals.validated.query, {
    productRequestId: requestId,
  });

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listRequestActivityActors(
  _req: Request,
  res: ValidatedResponse<unknown, Params>
) {
  const { requestId } = res.locals.validated.params;

  await assertRequest(requestId);

  const data = await listAdminAuditActorsService({
    productRequestId: requestId,
  });

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getRequestActivityDetails(
  _req: Request,
  res: ValidatedResponse<unknown, Params & { auditLogId: string }>
) {
  const { requestId, auditLogId } = res.locals.validated.params;

  await assertRequest(requestId);

  const auditLog = await getAdminAuditLogService(auditLogId, {
    productRequestId: requestId,
  });

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { auditLog } });
}
