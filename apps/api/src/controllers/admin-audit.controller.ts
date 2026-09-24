import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  AdminAuditListQuery,
  AdminAuditLogParams,
} from '../schemas/admin-audit.schema';

import {
  getAdminAuditLogService,
  listAdminAuditLogsService,
} from '../services/admin-audit.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

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
