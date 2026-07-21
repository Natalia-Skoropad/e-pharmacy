import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductRequest } from '../models/productRequest.model';
import { httpError } from '../utils/httpError';

//===============================================================

type PharmacyNoteEntityType =
  | 'client'
  | 'product'
  | 'pharmacy'
  | 'product_request';

//===============================================================

async function getPharmacyId(userId: string) {
  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();
  if (!pharmacy)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found');
  return pharmacy._id;
}

//===============================================================

async function assertEntityAccess(
  pharmacyId: Types.ObjectId,
  entityType: PharmacyNoteEntityType,
  entityId: string,
  requireDraft = false
) {
  if (entityType === 'product') {
    const offerExists = await ProductOffer.exists({
      pharmacyId,
      productId: new Types.ObjectId(entityId),
    });

    if (!offerExists) {
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'Add this product to your pharmacy before creating comments.'
      );
    }
  }

  if (entityType !== 'product_request') return;

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(entityId),
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
  const pharmacyId = await getPharmacyId(userId);
  await assertEntityAccess(pharmacyId, entityType, entityId);

  const filter = {
    pharmacyId,
    entityType,
    entityId: new Types.ObjectId(entityId),
  };
  const total = await PharmacyNote.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
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
  const pharmacyId = await getPharmacyId(userId);
  await assertEntityAccess(
    pharmacyId,
    entityType,
    entityId,
    entityType === 'product_request'
  );

  const note = await PharmacyNote.create({
    pharmacyId,
    entityType,
    entityId,
    text: text.trim(),
    createdBy: userId,
  });
  return {
    note: {
      id: String(note._id),
      text: note.text,
      createdAt: note.createdAt.toISOString(),
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
  const pharmacyId = await getPharmacyId(userId);
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
