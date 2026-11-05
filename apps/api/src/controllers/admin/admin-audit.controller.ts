import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  AdminAuditListQuery,
  AdminAuditLogParams,
  AdminAuditPhotoParams,
  AdminPharmacyAuditPhotoParams,
} from '../../schemas/admin/audit/admin-audit.schema';

import {
  getAdminAuditLogService,
  listAdminAuditLogsService,
} from '../../services/admin/audit/admin-audit-read.service';

import { listAdminAuditActorsService } from '../../services/admin/audit/admin-audit-actors.service';
import { getAdminAuditPhotoService } from '../../services/admin/audit/admin-audit-photo.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

export async function getAdminAuditLogs(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminAuditListQuery>
): Promise<void> {
  const data = await listAdminAuditLogsService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getAdminAuditActors(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await listAdminAuditActorsService();

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getAdminAuditLogDetails(
  _req: Request,
  res: ValidatedResponse<unknown, AdminAuditLogParams>
): Promise<void> {
  const auditLog = await getAdminAuditLogService(
    res.locals.validated.params.auditLogId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { auditLog },
  });
}

//===============================================================

async function sendAuditPhoto(
  res: Response,
  auditLogId: string,
  side: 'before' | 'after',
  pharmacyId?: string
): Promise<void> {
  const photo = await getAdminAuditPhotoService(auditLogId, side, pharmacyId);

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader(
    'Content-Disposition',
    `inline; filename="audit-pharmacy-photo-${side}.${photo.mimeType.split('/')[1]}"`
  );

  res.contentType(photo.mimeType);
  res.status(HTTP_STATUS.OK).send(photo.content);
}

//===================================================================

export async function getAdminAuditPhoto(
  _req: Request,
  res: ValidatedResponse<unknown, AdminAuditPhotoParams>
): Promise<void> {
  const { auditLogId, side } = res.locals.validated.params;

  await sendAuditPhoto(res, auditLogId, side);
}

//===================================================================

export async function getAdminScopedPharmacyAuditPhoto(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyAuditPhotoParams>
): Promise<void> {
  const { auditLogId, side, pharmacyId } = res.locals.validated.params;

  await sendAuditPhoto(res, auditLogId, side, pharmacyId);
}
