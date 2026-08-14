import type { ClientSession, HydratedDocument, Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  PHARMACY_OWNER_REQUIRED_ERROR_CODE,
  PHARMACY_PROFILE_BLOCKED_ERROR_CODE,
  PHARMACY_PROFILE_MISSING_ERROR_CODE,
} from '../constants/pharmacy-profile';

import { Pharmacy } from '../models/pharmacy.model';

import type {
  PharmacyEntity,
  PharmacyMembershipRole,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';

//===============================================================

export type PharmacyProfileCapability =
  | 'read_profile'
  | 'edit_profile'
  | 'manage_documents'
  | 'submit_profile';

//===============================================================

type PharmacyHydratedDocument = HydratedDocument<PharmacyEntity> & {
  _id: Types.ObjectId;
};

//===============================================================

const PHARMACY_PROFILE_CAPABILITIES_BY_MEMBERSHIP = {
  owner: [
    'read_profile',
    'edit_profile',
    'manage_documents',
    'submit_profile',
  ],
  manager: ['read_profile'],
} as const satisfies Record<
  PharmacyMembershipRole,
  readonly PharmacyProfileCapability[]
>;

//===============================================================

function resolveMembershipRole(
  pharmacy: PharmacyHydratedDocument,
  userId: string
): PharmacyMembershipRole | null {
  if (String(pharmacy.ownerId) === userId) return 'owner';

  return pharmacy.managerUserIds.some(
    (managerUserId) => String(managerUserId) === userId
  )
    ? 'manager'
    : null;
}

//===============================================================

export function canPharmacyMembershipUseProfileCapability(
  membershipRole: PharmacyMembershipRole,
  capability: PharmacyProfileCapability
): boolean {
  return (
    PHARMACY_PROFILE_CAPABILITIES_BY_MEMBERSHIP[
      membershipRole
    ] as readonly PharmacyProfileCapability[]
  ).includes(capability);
}

//===============================================================

export async function findPharmacyForProfileAccess(
  userId: string,
  capability: PharmacyProfileCapability,
  session?: ClientSession
): Promise<{
  pharmacy: PharmacyHydratedDocument;
  membershipRole: PharmacyMembershipRole;
}> {
  const query = Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  });

  if (session) query.session(session);

  const pharmacy = (await query) as PharmacyHydratedDocument | null;

  if (!pharmacy) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Pharmacy profile is missing for this pharmacy account.',
      undefined,
      PHARMACY_PROFILE_MISSING_ERROR_CODE
    );
  }

  if (pharmacy.status === PHARMACY_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy is blocked.',
      undefined,
      PHARMACY_PROFILE_BLOCKED_ERROR_CODE
    );
  }

  const membershipRole = resolveMembershipRole(pharmacy, userId);

  if (
    !membershipRole ||
    !canPharmacyMembershipUseProfileCapability(membershipRole, capability)
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only the pharmacy owner can change verification profile data.',
      undefined,
      PHARMACY_OWNER_REQUIRED_ERROR_CODE
    );
  }

  return { pharmacy, membershipRole };
}
