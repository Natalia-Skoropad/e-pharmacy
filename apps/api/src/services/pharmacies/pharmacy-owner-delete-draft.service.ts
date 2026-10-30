import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyDocumentFile } from '../../models/pharmacies/pharmacyDocumentFile.model';
import { PharmacyPaymentIdentifier } from '../../models/pharmacies/pharmacyPaymentIdentifier.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';

import { Order } from '../../models/orders/order.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { PharmacyReview } from '../../models/reviews/pharmacyReview.model';
import { StockMovement } from '../../models/inventory/stockMovement.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import { httpError } from '../../utils/http/httpError';

import { getPharmacyMembership } from './pharmacy-membership.service';
import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin/audit/admin-audit';

//===================================================================

/** Permanently remove a never-submitted draft and its private files, not an operational pharmacy. */
export async function deleteOwnedPharmacyDraftService(
  userId: string,
  pharmacyId: string,
  expectedRevision: string,
  requestId: string
) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const { pharmacy, membershipRole } = await getPharmacyMembership(
        userId,
        pharmacyId,
        { session }
      );

      if (membershipRole !== 'owner') {
        throw httpError(
          HTTP_STATUS.FORBIDDEN,
          'Only the pharmacy owner can delete a draft.'
        );
      }

      if (pharmacy.status !== PHARMACY_STATUSES.NEW) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Only a New pharmacy draft can be deleted.'
        );
      }

      if (pharmacy.updatedAt.toISOString() !== expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'The pharmacy was updated. Refresh and retry.'
        );
      }

      // Never delete operational resources, even if a legacy record has status NEW.
      // MongoDB transactions do not support parallel operations on the
      // same session. Perform each safety check in sequence.
      const orders = await Order.exists({ pharmacyId: pharmacy._id }).session(
        session
      );

      const requests = await ProductRequest.exists({
        pharmacyId: pharmacy._id,
      }).session(session);

      const offers = await ProductOffer.exists({
        pharmacyId: pharmacy._id,
      }).session(session);

      const reviews = await PharmacyReview.exists({
        pharmacyId: pharmacy._id,
      }).session(session);

      const stock = await StockMovement.exists({
        pharmacyId: pharmacy._id,
      }).session(session);

      if (orders || requests || offers || reviews || stock) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This draft has linked operational records and cannot be deleted.'
        );
      }

      const removed = await Pharmacy.deleteOne({
        _id: pharmacy._id,
        ownerId: userId,
        status: PHARMACY_STATUSES.NEW,
        updatedAt: pharmacy.updatedAt,
      }).session(session);

      if (removed.deletedCount !== 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'The draft changed. Refresh and retry.'
        );
      }

      await PharmacyDocumentFile.deleteMany({
        pharmacyId: pharmacy._id,
      }).session(session);

      await PharmacyNote.deleteMany({ pharmacyId: pharmacy._id }).session(
        session
      );

      await PharmacyPaymentIdentifier.deleteMany({
        pharmacyId: pharmacy._id,
      }).session(session);

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: pharmacyId,
        entityLabel: pharmacy.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: String(pharmacy.ownerId),
        before: { status: PHARMACY_STATUSES.NEW, exists: true },
        after: { exists: false },
        changedFields: ['exists'],
        reason: 'Owner permanently deleted a New pharmacy draft.',
        requestId,
        session,
      });

      return { deleted: true as const };
    });
  } finally {
    await session.endSession();
  }
}
