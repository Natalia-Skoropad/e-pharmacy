import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import type { AdminAuditListQuery } from '../schemas/admin-audit.schema';

import {
  getAdminAuditLogService,
  listAdminAuditActorsService,
  listAdminAuditLogsService,
} from './admin-audit.service';

import { httpError } from '../utils/httpError';

//===============================================================

async function assertPharmacyExists(pharmacyId: string): Promise<void> {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  const exists = await Pharmacy.exists({ _id: new Types.ObjectId(pharmacyId) });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }
}

//===============================================================

export async function listAdminPharmacyActivityService(
  pharmacyId: string,
  query: AdminAuditListQuery
) {
  await assertPharmacyExists(pharmacyId);

  return listAdminAuditLogsService(query, { pharmacyId });
}

//===============================================================

export async function listAdminPharmacyActivityActorsService(
  pharmacyId: string
) {
  await assertPharmacyExists(pharmacyId);

  return listAdminAuditActorsService({ pharmacyId });
}

//===============================================================

export async function getAdminPharmacyActivityDetailsService(
  pharmacyId: string,
  auditLogId: string
) {
  await assertPharmacyExists(pharmacyId);

  return getAdminAuditLogService(auditLogId, { pharmacyId });
}
