import { PHARMACY_STATUSES, USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '../../constants/catalog/product-management';

import {
  requirePharmacyCapability,
  isPharmacyMembershipMissing,
} from '../pharmacies/pharmacy-membership.service';

import type { ManagedProductsQuery } from '../../schemas/catalog/product.schema';
import type { UserRole } from '../../types/accounts/user';

import { httpError } from '../../utils/http/httpError';

import type { ProductOfferVisibility } from './product-projections';

//===============================================================

const PHARMACY_PRODUCT_MANAGEMENT_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===============================================================

export type ProductManagementActor = Readonly<{
  userId: string;
  role?: UserRole;
}>;

//===============================================================

export async function getCurrentUserPharmacyForManagedProductRead(
  userId: string
) {
  try {
    const { pharmacy } = await requirePharmacyCapability(
      userId,
      'read_products'
    );

    return pharmacy;
  } catch (error) {
    if (isPharmacyMembershipMissing(error)) {
      throw httpError(
        HTTP_STATUS.NOT_FOUND,
        'Pharmacy profile was not found.',
        undefined,

        PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND
      );
    }

    throw error;
  }
}

//===============================================================

function assertCurrentPharmacyScope(
  requestedPharmacyId: string | undefined,
  currentPharmacyId: string
): void {
  if (requestedPharmacyId && requestedPharmacyId !== currentPharmacyId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this pharmacy.'
    );
  }
}

//===============================================================

export async function getManagedProductOfferVisibility(
  actor: ProductManagementActor
): Promise<ProductOfferVisibility> {
  if (actor.role === USER_ROLES.ADMIN) {
    return { mode: 'admin-management' };
  }

  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  }

  const pharmacy = await getCurrentUserPharmacyForManagedProductRead(
    actor.userId
  );

  return {
    mode: 'pharmacy-management',
    pharmacyId: String(pharmacy._id),
  };
}

//===============================================================

export async function resolveManagedProductsAccess(
  query: ManagedProductsQuery,
  actor: ProductManagementActor
): Promise<{
  query: ManagedProductsQuery;
  offerVisibility: ProductOfferVisibility;
}> {
  const offerVisibility = await getManagedProductOfferVisibility(actor);

  if (offerVisibility.mode !== 'pharmacy-management') {
    return { query, offerVisibility };
  }

  const currentPharmacyId = offerVisibility.pharmacyId;

  assertCurrentPharmacyScope(query.pharmacyId, currentPharmacyId);
  assertCurrentPharmacyScope(query.addedToPharmacyId, currentPharmacyId);

  return {
    query: {
      ...query,
      ...(query.pharmacyId ? { pharmacyId: currentPharmacyId } : {}),
      ...(typeof query.addedToMyPharmacy === 'boolean' ||
      query.addedToPharmacyId
        ? { addedToPharmacyId: currentPharmacyId }
        : {}),
    },

    offerVisibility,
  };
}

//===============================================================

export async function getCurrentUserPharmacyForProductManagement(
  userId: string
) {
  let pharmacy;

  try {
    ({ pharmacy } = await requirePharmacyCapability(userId, 'manage_products'));
  } catch (error) {
    if (isPharmacyMembershipMissing(error)) {
      throw httpError(
        HTTP_STATUS.NOT_FOUND,
        'Pharmacy profile was not found.',
        undefined,

        PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND
      );
    }

    throw error;
  }

  const canManageProducts = PHARMACY_PRODUCT_MANAGEMENT_STATUSES.some(
    (status) => status === pharmacy.status
  );

  if (!canManageProducts) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Products can be added only after Admin verifies the pharmacy profile.',
      undefined,

      PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_LOCKED
    );
  }

  return pharmacy;
}
