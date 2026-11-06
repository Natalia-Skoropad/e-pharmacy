import { Types } from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../../constants/auth/auth';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import { httpError } from '../../utils/http/httpError';

//===============================================================

/** Owner-wide reads are authorized by persisted ownership, never a selected header. */
export async function getOwnedClientPharmacyIds(
  userId: string
): Promise<Types.ObjectId[]> {
  if (!/^[0-9a-f]{24}$/i.test(userId)) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy owner access is forbidden.'
    );
  }

  const owner = await User.findById(userId).select('role status').lean();

  if (
    !owner ||
    owner.role !== USER_ROLES.PHARMACY ||
    owner.status === USER_STATUSES.BLOCKED
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy owner access is forbidden.'
    );
  }

  const pharmacies = await Pharmacy.find({
    ownerId: new Types.ObjectId(userId),

    // Match the existing read_clients membership rule: blocked pharmacies
    // do not expose their operational customer records.
    status: { $ne: PHARMACY_STATUSES.BLOCKED },
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  return pharmacies.map((pharmacy) => pharmacy._id);
}
