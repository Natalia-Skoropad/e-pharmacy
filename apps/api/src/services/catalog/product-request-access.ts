import { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import { USER_ROLES, USER_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { httpError } from '../../utils/http/httpError';
import type { PharmacyEntity } from '../../types/pharmacies/pharmacy';

import {
  requirePharmacyCapability,
  isPharmacyMembershipMissing,
} from '../pharmacies/pharmacy-membership.service';

//===============================================================

export type CurrentPharmacy = {
  _id: Types.ObjectId;
  status: PharmacyEntity['status'];
};

//===============================================================

export async function getCurrentPharmacy(
  userId: string,

  capability:
    | 'read_product_requests'
    | 'manage_product_requests' = 'read_product_requests'
): Promise<CurrentPharmacy | null> {
  try {
    const { pharmacy } = await requirePharmacyCapability(userId, capability);

    return { _id: pharmacy._id, status: pharmacy.status };
  } catch (error) {
    if (isPharmacyMembershipMissing(error)) return null;

    throw error;
  }
}

//===============================================================

export async function getCurrentPharmacyId(userId: string) {
  const pharmacy = await getCurrentPharmacy(userId);

  return pharmacy?._id ?? null;
}

//===============================================================

// Product requests now belong to a pharmacy owner, never to the selected
// pharmacy. Legacy requests can still be read through their old pharmacyId
// while they are gradually migrated to ownerId. A foreign owner's records
// must not leak through an unrelated selected-pharmacy header.

export async function getProductRequestOwnerScope(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy owner access is forbidden.'
    );
  }

  const owner = await User.findById(userId).select('role status');

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

  const ownerId = new Types.ObjectId(userId);

  const pharmacies = await Pharmacy.find({ ownerId })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const legacyPharmacyIds = pharmacies.map((pharmacy) => pharmacy._id);

  const filter = {
    $or: [
      { ownerId },
      { ownerId: { $exists: false }, pharmacyId: { $in: legacyPharmacyIds } },
    ],
  };

  return { ownerId, legacyPharmacyIds, filter };
}
