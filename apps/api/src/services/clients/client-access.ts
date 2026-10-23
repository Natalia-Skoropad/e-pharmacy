import {
  requirePharmacyCapability,
  isPharmacyMembershipMissing,
} from '../pharmacies/pharmacy-membership.service';

//===============================================================

export async function getCurrentPharmacyId(userId: string) {
  try {
    const { pharmacy } = await requirePharmacyCapability(
      userId,
      'read_clients'
    );

    return pharmacy._id;
  } catch (error) {
    if (isPharmacyMembershipMissing(error)) return null;

    throw error;
  }
}
