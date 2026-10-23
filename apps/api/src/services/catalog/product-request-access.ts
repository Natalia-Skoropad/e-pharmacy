import { Types } from 'mongoose';

import type { PharmacyEntity } from '../../types/pharmacy';

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
