import { Types } from 'mongoose';

import { ADMIN_AUDIT_ENTITY_TYPES } from '../../../constants/admin-audit';
import { USER_ROLES } from '../../../constants/auth';
import { HTTP_STATUS } from '../../../constants/httpStatus';

import { User } from '../../../models/accounts/user.model';

import type { AdminPharmacyOwnerActivityQuery } from '../../../schemas/admin-pharmacy-owner.schema';

import { httpError } from '../../../utils/httpError';
import { listAdminAuditLogsService } from '../audit/admin-audit-read.service';

//===============================================================

export async function listAdminPharmacyOwnerActivityService(
  ownerId: string,
  query: AdminPharmacyOwnerActivityQuery
) {
  const ownerExists = await User.exists({
    _id: new Types.ObjectId(ownerId),
    role: USER_ROLES.PHARMACY,
  });

  if (!ownerExists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  return listAdminAuditLogsService({
    ...query,
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: ownerId,
  });
}
