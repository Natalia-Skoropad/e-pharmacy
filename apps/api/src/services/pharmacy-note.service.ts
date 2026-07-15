import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { httpError } from '../utils/httpError';

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

export async function getPharmacyNotesService(
  userId: string,
  entityType: 'client' | 'product' | 'pharmacy',
  entityId: string,
  page: number,
  perPage: number
) {
  const pharmacyId = await getPharmacyId(userId);
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
  entityType: 'client' | 'product' | 'pharmacy',
  entityId: string,
  text: string
) {
  const pharmacyId = await getPharmacyId(userId);
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
  entityType: 'client' | 'product' | 'pharmacy',
  entityId: string,
  noteId: string
) {
  const pharmacyId = await getPharmacyId(userId);
  const deleted = await PharmacyNote.findOneAndDelete({
    _id: noteId,
    pharmacyId,
    entityType,
    entityId,
  });
  if (!deleted) throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
  return { message: 'Comment deleted successfully.' };
}
