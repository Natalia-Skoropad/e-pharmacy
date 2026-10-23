import type { Types } from 'mongoose';

import { User } from '../../../models/accounts/user.model';

//===================================================================

// Mongo integration fixtures must contain real pharmacy-role accounts.
// An ownerId/managerUserIds reference alone is not sufficient for membership.
export async function seedIntegrationPharmacyActors(
  userIds: readonly Types.ObjectId[]
): Promise<void> {
  await User.create(
    userIds.map((id) => ({
      _id: id,
      name: 'Integration Pharmacy Account',
      email: `integration-pharmacy-${id.toHexString()}@example.com`,
      phone: `+380${(BigInt(`0x${id.toHexString().slice(-12)}`) % 1000000000n).toString().padStart(9, '0')}`,
      password: 'test-password-hash',
      role: 'pharmacy',
      status: 'active',
    }))
  );
}
