import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type { AdminAuditListQuery } from '../../schemas/admin/audit/admin-audit.schema';
import type { AdminPharmacyParams } from '../../schemas/admin/admin.schema';

import type {
  AdminPharmacyOwnerActivityQuery,
  AdminPharmacyOwnerParams,
} from '../../schemas/admin/owners/admin-pharmacy-owner.schema';

import { listAdminPharmacyOwnerActivityService } from '../../services/admin/owners/admin-pharmacy-owner-activity.service';

import {
  getAdminPharmacyActivityDetailsService,
  listAdminPharmacyActivityActorsService,
  listAdminPharmacyActivityService,
} from '../../services/admin/audit/admin-pharmacy-activity.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

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
