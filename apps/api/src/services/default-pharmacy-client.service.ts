import { Types, type ClientSession } from 'mongoose';

import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';

//===============================================================

const DEFAULT_CLIENT_NAME = 'Walk-in customer';
const DEFAULT_CLIENT_PASSWORD = 'walk-in-client-disabled-login';

//===============================================================

function getDefaultClientPhone(pharmacyId: Types.ObjectId): string {
  const digits = pharmacyId
    .toString()
    .replace(/\D/g, '')
    .slice(-9)
    .padStart(9, '0');
  return `+380${digits}`;
}

//===============================================================

function getDefaultClientEmail(pharmacyId: Types.ObjectId): string {
  return `walk-in+${pharmacyId.toString()}@e-pharmacy.local`;
}

//===============================================================

export async function ensureDefaultPharmacyClient(
  pharmacyId: Types.ObjectId | string,
  createdBy?: Types.ObjectId | string,
  session?: ClientSession
) {
  const resolvedPharmacyId =
    pharmacyId instanceof Types.ObjectId
      ? pharmacyId
      : new Types.ObjectId(pharmacyId);

  const pharmacyQuery = Pharmacy.findById(resolvedPharmacyId).select(
    '_id ownerId activatedAt approvedAt createdAt'
  );

  if (session) pharmacyQuery.session(session);

  const pharmacy = await pharmacyQuery.lean<{
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    activatedAt?: Date;
    approvedAt?: Date;
    createdAt: Date;
  } | null>();

  if (!pharmacy) return null;

  const password = await hashPassword(DEFAULT_CLIENT_PASSWORD);
  const activatedAt =
    pharmacy.activatedAt ?? pharmacy.approvedAt ?? pharmacy.createdAt;
  const actorId = createdBy
    ? createdBy instanceof Types.ObjectId
      ? createdBy
      : new Types.ObjectId(createdBy)
    : pharmacy.ownerId;

  const user = await User.findOneAndUpdate(
    {
      isDefaultPharmacyClient: true,
      defaultClientPharmacyId: pharmacy._id,
    },
    {
      $set: {
        name: DEFAULT_CLIENT_NAME,
        email: getDefaultClientEmail(pharmacy._id),
        password,
        role: USER_ROLES.CLIENT,
        status: USER_STATUSES.ACTIVE,
        phone: getDefaultClientPhone(pharmacy._id),
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacy._id,
        updatedBy: actorId,
      },

      $unset: {
        address: '',
        pictureUrl: '',
        statusReason: '',
      },

      $setOnInsert: {
        createdBy: actorId,
        createdAt: activatedAt,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    }
  );

  if (!user) return null;

  await User.updateOne(
    { _id: user._id },
    { $set: { createdAt: activatedAt } },
    session ? { session } : undefined
  );

  await Client.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        favoriteProductIds: [],
        favoritePharmacyIds: [],
      },
    },
    {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    }
  );

  return user;
}
