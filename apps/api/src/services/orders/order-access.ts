import mongoose from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { isPharmacyOperationalStatus } from '../../constants/pharmacies/pharmacy-status';

import {
  requirePharmacyCapability,
  isPharmacyMembershipMissing,
} from '../pharmacies/pharmacy-membership.service';

import { httpError } from '../../utils/httpError';

import type { PharmacyEntity } from '../../types/pharmacy';
import type { UserRole } from '../../types/user';
import type { OrderDocument } from './order-shared';

//===============================================================

async function getAuthorizedPharmacyOrderStatus(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession,
  capability: 'read_orders' | 'manage_orders' = 'read_orders'
): Promise<PharmacyEntity['status'] | null> {
  if (actor.role === USER_ROLES.ADMIN) return null;

  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only pharmacy users or admins can access orders.'
    );
  }

  const { pharmacy } = await requirePharmacyCapability(actor.id, capability, {
    pharmacyId: String(order.pharmacyId),
    session,
  });

  return pharmacy.status;
}

//===============================================================

export async function assertCanAccessPharmacyOrder(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession
): Promise<void> {
  await getAuthorizedPharmacyOrderStatus(actor, order, session);
}

//===============================================================

export async function assertCanEditPharmacyOrder(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession
): Promise<void> {
  const pharmacyStatus = await getAuthorizedPharmacyOrderStatus(
    actor,
    order,
    session,
    'manage_orders'
  );

  if (pharmacyStatus !== null && !isPharmacyOperationalStatus(pharmacyStatus)) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Order changes are unavailable while the pharmacy is not active.'
    );
  }
}

//===============================================================

export async function getCurrentPharmacyId(userId: string) {
  try {
    const { pharmacy } = await requirePharmacyCapability(userId, 'read_orders');

    return pharmacy._id;
  } catch (error) {
    if (isPharmacyMembershipMissing(error)) return null;

    throw error;
  }
}
