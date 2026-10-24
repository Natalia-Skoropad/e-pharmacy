import type { ClientSession, HydratedDocument, Types } from 'mongoose';
import { Types as MongoTypes } from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../../constants/auth';

import { HTTP_STATUS } from '../../constants/httpStatus';

import {
  PHARMACY_OWNER_REQUIRED_ERROR_CODE,
  PHARMACY_PROFILE_BLOCKED_ERROR_CODE,
  PHARMACY_PROFILE_MISSING_ERROR_CODE,
} from '../../constants/pharmacy-profile';

import { getSelectedPharmacyId } from '../../middlewares/pharmacies/pharmacy-selection.middleware';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type {
  PharmacyEntity,
  PharmacyMembershipRole,
} from '../../types/pharmacy';

import type { UserRole } from '../../types/user';

import { httpError } from '../../utils/httpError';

//===============================================================

// These are backend grants, not promises about future employee permissions.
// managerUserIds is only a membership indicator. Grant further capabilities
// when a persisted, pharmacy-specific permission model exists.
export type PharmacyCapability =
  | 'read_profile'
  | 'edit_profile'
  | 'manage_documents'
  | 'submit_profile'
  | 'read_orders'
  | 'manage_orders'
  | 'read_clients'
  | 'manage_clients'
  | 'read_products'
  | 'manage_products'
  | 'read_product_requests'
  | 'manage_product_requests'
  | 'read_internal_notes'
  | 'manage_internal_notes'
  | 'read_stock';

//===============================================================

export type PharmacyProfileCapability = Extract<
  PharmacyCapability,
  'read_profile' | 'edit_profile' | 'manage_documents' | 'submit_profile'
>;

export type PharmacyInternalNotesCapability = Extract<
  PharmacyCapability,
  'read_internal_notes' | 'manage_internal_notes'
>;

export type PharmacyInternalNotesActor = Readonly<{
  id: string;
  role: UserRole;
}>;

//===============================================================

type PharmacyHydratedDocument = HydratedDocument<PharmacyEntity> & {
  _id: Types.ObjectId;
};

export type PharmacyMembership = {
  pharmacy: PharmacyHydratedDocument;
  membershipRole: PharmacyMembershipRole;
};

type MembershipOptions = Readonly<{
  allowBlocked?: boolean;
  session?: ClientSession;
}>;

//===============================================================

const OWNER_CAPABILITIES: readonly PharmacyCapability[] = [
  'read_profile',
  'edit_profile',
  'manage_documents',
  'submit_profile',
  'read_orders',
  'manage_orders',
  'read_clients',
  'manage_clients',
  'read_products',
  'manage_products',
  'read_product_requests',
  'manage_product_requests',
  'read_internal_notes',
  'manage_internal_notes',
  'read_stock',
];

//===============================================================

// Existing pharmacy-internal shared notes remain available to legacy managers.
// They are separate from private user comments (which always use ownerUserId).
const MANAGER_CAPABILITIES: readonly PharmacyCapability[] = [
  'read_profile',
  'read_internal_notes',
  'manage_internal_notes',
];

//===============================================================

export function canPharmacyMembershipUseCapability(
  role: PharmacyMembershipRole,
  capability: PharmacyCapability
): boolean {
  return (
    role === 'owner' ? OWNER_CAPABILITIES : MANAGER_CAPABILITIES
  ).includes(capability);
}

//===============================================================

export const canPharmacyMembershipUseProfileCapability =
  canPharmacyMembershipUseCapability;

//===============================================================

function memberRole(
  pharmacy: PharmacyHydratedDocument,
  userId: string
): PharmacyMembershipRole | null {
  if (String(pharmacy.ownerId) === userId) return 'owner';

  return pharmacy.managerUserIds?.some((id) => String(id) === userId)
    ? 'manager'
    : null;
}

//===============================================================

// One authoritative check for (userId, pharmacyId). A missing foreign pharmacy
// returns 403 for a foreign pharmacy; a non-existent
// id returns 404; malformed ids return 400.
export async function getPharmacyMembership(
  userId: string,
  pharmacyId: string,
  options: MembershipOptions = {}
): Promise<PharmacyMembership> {
  if (!MongoTypes.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid pharmacy id.');
  }

  if (!MongoTypes.ObjectId.isValid(userId)) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
  }

  const selected = getSelectedPharmacyId();

  if (selected && selected !== pharmacyId.toLowerCase()) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Selected pharmacy does not match requested pharmacy.'
    );
  }

  const query = Pharmacy.findOne({
    _id: pharmacyId,
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  });

  if (options.session) query.session(options.session);

  const pharmacy = (await query) as PharmacyHydratedDocument | null;

  if (!pharmacy) {
    const exists = await Pharmacy.exists({ _id: pharmacyId }).session(
      options.session ?? null
    );

    throw exists
      ? httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.')
      : httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  const membershipRole = memberRole(pharmacy, userId);

  if (!membershipRole)
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');

  const account = await User.findById(userId)
    .select('role status')
    .session(options.session ?? null);

  if (
    !account ||
    account.role !== USER_ROLES.PHARMACY ||
    account.status === USER_STATUSES.BLOCKED
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy account is blocked or unavailable.'
    );
  }

  // A manager cannot bypass the blocked owner's account by using a still-active
  // pharmacy record. Summary is the only blocked-status inspection exception.
  if (membershipRole === 'manager' && !options.allowBlocked) {
    const ownerAccount = await User.findById(pharmacy.ownerId)
      .select('role status')
      .session(options.session ?? null);

    if (
      !ownerAccount ||
      ownerAccount.role !== USER_ROLES.PHARMACY ||
      ownerAccount.status === USER_STATUSES.BLOCKED
    ) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'The pharmacy owner is blocked or unavailable.'
      );
    }
  }

  if (pharmacy.status === PHARMACY_STATUSES.BLOCKED && !options.allowBlocked) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy is blocked.',
      undefined,

      PHARMACY_PROFILE_BLOCKED_ERROR_CODE
    );
  }

  return { pharmacy, membershipRole };
}

//===============================================================

// No first-match fallback: for a single membership keep legacy /me routes
// usable; for multiple memberships require an explicit X-Pharmacy-ID.
export async function resolveSelectedPharmacyMembership(
  userId: string,
  options: MembershipOptions = {}
): Promise<PharmacyMembership> {
  const selected = getSelectedPharmacyId();

  if (selected) return getPharmacyMembership(userId, selected, options);

  const query = Pharmacy.find({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .limit(2);

  if (options.session) query.session(options.session);

  const memberships = await query.lean<Array<{ _id: Types.ObjectId }>>();

  if (!memberships.length) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Pharmacy profile is missing for this pharmacy account.',
      undefined,

      PHARMACY_PROFILE_MISSING_ERROR_CODE
    );
  }

  if (memberships.length > 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Select a pharmacy using X-Pharmacy-ID before using this endpoint.',
      undefined,
      'PHARMACY_SELECTION_REQUIRED'
    );
  }

  return getPharmacyMembership(userId, String(memberships[0]._id), options);
}

//===============================================================

export async function requirePharmacyCapability(
  userId: string,
  capability: PharmacyCapability,
  options: MembershipOptions & Readonly<{ pharmacyId?: string }> = {}
): Promise<PharmacyMembership> {
  const membership = options.pharmacyId
    ? await getPharmacyMembership(userId, options.pharmacyId, options)
    : await resolveSelectedPharmacyMembership(userId, options);

  if (
    !canPharmacyMembershipUseCapability(membership.membershipRole, capability)
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'This pharmacy membership does not grant the requested permission.',
      undefined,
      ['edit_profile', 'manage_documents', 'submit_profile'].includes(
        capability
      )
        ? PHARMACY_OWNER_REQUIRED_ERROR_CODE
        : undefined
    );
  }

  if (
    capability !== 'read_profile' &&
    capability !== 'read_internal_notes' &&
    capability !== 'read_orders' &&
    capability !== 'read_clients' &&
    capability !== 'read_products' &&
    capability !== 'read_product_requests' &&
    capability !== 'read_stock'
  ) {
    const owner = await User.findOne({
      _id: membership.pharmacy.ownerId,
      role: USER_ROLES.PHARMACY,
    }).session(options.session ?? null);

    if (!owner || owner.status === USER_STATUSES.BLOCKED) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'Blocked or missing owner cannot operate this pharmacy.'
      );
    }
  }

  return membership;
}

//===============================================================

export async function findPharmacyForSummaryAccess(
  userId: string,
  session?: ClientSession
): Promise<PharmacyMembership> {
  return resolveSelectedPharmacyMembership(userId, {
    session,
    allowBlocked: true,
  });
}

//===============================================================

export async function findPharmacyForProfileAccess(
  userId: string,
  capability: PharmacyProfileCapability,
  session?: ClientSession,
  pharmacyId?: string
): Promise<PharmacyMembership> {
  return requirePharmacyCapability(userId, capability, { session, pharmacyId });
}

//===============================================================

export async function findPharmacyForInternalNotesAccess(
  actor: PharmacyInternalNotesActor,
  capability: PharmacyInternalNotesCapability,
  session?: ClientSession
): Promise<PharmacyMembership> {
  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
  }

  return requirePharmacyCapability(actor.id, capability, { session });
}

//===============================================================

// Return all accessible pharmacies for an account-switcher, without choosing
// one on behalf of the user. Blocked pharmacies remain visible to the owner.
export async function listUserPharmacyMemberships(userId: string) {
  const user = await User.findById(userId).select('role status');

  if (
    !user ||
    user.role !== USER_ROLES.PHARMACY ||
    user.status === USER_STATUSES.BLOCKED
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy account is blocked or unavailable.'
    );
  }

  const pharmacies = await Pharmacy.find({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id name status ownerId managerUserIds')
    .sort({ createdAt: 1, _id: 1 });

  return {
    pharmacies: pharmacies.map((pharmacy) => ({
      id: String(pharmacy._id),
      name: pharmacy.name,
      status: pharmacy.status,
      membershipRole: memberRole(pharmacy as PharmacyHydratedDocument, userId),
    })),
  };
}

//===============================================================

// Preserve legacy 404/empty-state contracts on individual business endpoints,
// without swallowing the 409 that signals ambiguous multi-pharmacy selection.
export function isPharmacyMembershipMissing(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === PHARMACY_PROFILE_MISSING_ERROR_CODE
  );
}
