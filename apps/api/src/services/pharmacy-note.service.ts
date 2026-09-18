import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductRequest } from '../models/productRequest.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { findPharmacyForInternalNotesAccess } from './pharmacy-membership.service';

//===============================================================

type PharmacyNoteEntityType =
  | 'client'
  | 'product'
  | 'pharmacy'
  | 'product_request';

//===============================================================

type PharmacyNoteAuthorUser = {
  name?: string;
  email?: string;
};

//===============================================================

function getPharmacyNoteAuthorDisplayName(
  user?: PharmacyNoteAuthorUser | null
): string {
  return user?.name?.trim() || user?.email?.trim() || 'Pharmacy member';
}

//===============================================================

async function assertEntityAccess(
  pharmacyId: Types.ObjectId,
  entityType: PharmacyNoteEntityType,
  entityId: string,
  requireDraft = false
) {
  const objectId = new Types.ObjectId(entityId);

  if (entityType === 'pharmacy') {
    if (!pharmacyId.equals(objectId)) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
    }
    return;
  }

  if (entityType === 'client') {
    const [clientHasOrders, isDefaultClient] = await Promise.all([
      Order.exists({ pharmacyId, userId: objectId }),
      User.exists({
        _id: objectId,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    if (!clientHasOrders && !isDefaultClient) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found.');
    }
    return;
  }

  if (entityType === 'product') {
    const offerExists = await ProductOffer.exists({
      pharmacyId,
      productId: objectId,
    });

    if (!offerExists) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'Add this product to your pharmacy before creating comments.'
      );
    }
    return;
  }

  const request = await ProductRequest.findOne({
    _id: objectId,
    pharmacyId,
  })
    .select('status')
    .lean<{ status: string } | null>();

  if (!request) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  if (requireDraft && request.status !== 'draft') {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product request comments can be edited only while the request is a draft.'
    );
  }
}

//===============================================================

export async function getPharmacyNotesService(
  userId: string,
  entityType: PharmacyNoteEntityType,
  entityId: string,
  page: number,
  perPage: number
) {
  const { pharmacy } = await findPharmacyForInternalNotesAccess(
    userId,
    'read_internal_notes'
  );

  const pharmacyId = pharmacy._id;

  await assertEntityAccess(pharmacyId, entityType, entityId);

  const filter = {
    pharmacyId,
    entityType,
    entityId: new Types.ObjectId(entityId),
  };

  const total = await PharmacyNote.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const notes = await PharmacyNote.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * perPage)
    .limit(perPage)
    .lean();

  return {
    items: notes.map((note) => ({
      id: String(note._id),
      text: note.text,
      createdAt: note.createdAt.toISOString(),

      author: {
        userId: String(note.createdBy),
        displayName: note.authorDisplayName?.trim() || 'Pharmacy member',
      },
    })),

    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

export async function createPharmacyNoteService(
  userId: string,
  entityType: PharmacyNoteEntityType,
  entityId: string,
  text: string
) {
  const { pharmacy } = await findPharmacyForInternalNotesAccess(
    userId,
    'manage_internal_notes'
  );

  const pharmacyId = pharmacy._id;

  await assertEntityAccess(
    pharmacyId,
    entityType,
    entityId,
    entityType === 'product_request'
  );

  const author = await User.findById(userId)
    .select('name email')
    .lean<PharmacyNoteAuthorUser | null>();

  const authorDisplayName = getPharmacyNoteAuthorDisplayName(author);

  const note = await PharmacyNote.create({
    pharmacyId,
    entityType,
    entityId,
    text: text.trim(),
    createdBy: userId,
    authorDisplayName,
  });

  return {
    note: {
      id: String(note._id),
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      author: {
        userId,
        displayName: authorDisplayName,
      },
    },
  };
}

//===============================================================

export async function deletePharmacyNoteService(
  userId: string,
  entityType: PharmacyNoteEntityType,
  entityId: string,
  noteId: string
) {
  const { pharmacy } = await findPharmacyForInternalNotesAccess(
    userId,
    'manage_internal_notes'
  );

  const pharmacyId = pharmacy._id;

  await assertEntityAccess(
    pharmacyId,
    entityType,
    entityId,
    entityType === 'product_request'
  );

  const deleted = await PharmacyNote.findOneAndDelete({
    _id: noteId,
    pharmacyId,
    entityType,
    entityId,
  });

  if (!deleted) throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
  return { message: 'Comment deleted successfully.' };
}
