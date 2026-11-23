import { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { ProductRequest } from '../../models/catalog/productRequest.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { User } from '../../models/accounts/user.model';

import type { CreatePharmacyNoteInput } from '../../schemas/pharmacies/pharmacy-note.schema';
import type { PharmacyInternalNotesActor } from '../pharmacies/pharmacy-membership.service';

import { httpError } from '../../utils/http/httpError';
import { hasMongoDuplicateKeyCode } from '../../utils/database/mongoError';

import { getProductRequestOwnerScope } from './product-request-access';

//===============================================================

async function resolveScope(
  actor: PharmacyInternalNotesActor,
  requestId: string,
  mutate: boolean
) {
  if (
    actor.role !== USER_ROLES.PHARMACY ||
    !Types.ObjectId.isValid(requestId)
  ) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const owner = await getProductRequestOwnerScope(actor.id);
  const requestObjectId = new Types.ObjectId(requestId);

  const request = await ProductRequest.findOne({
    _id: requestObjectId,
    ...owner.filter,
  })
    .select('status reviewState')
    .lean<{ status: string; reviewState?: string } | null>();

  if (!request)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');

  if (
    mutate &&
    !(
      request.status === 'new' ||
      (request.status === 'on_moderation' &&
        request.reviewState === 'changes_requested')
    )
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comments may be edited only in New or Needs changes.'
    );
  }

  const filter = {
    entityType: 'product_request' as const,
    entityId: requestObjectId,

    $or: [
      { ownerId: owner.ownerId },
      {
        ownerId: { $exists: false },
        pharmacyId: { $in: owner.legacyPharmacyIds },
      },
    ],
  };

  return { filter, ownerId: owner.ownerId, requestObjectId };
}

//===============================================================

type LeanNote = {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
  authorDisplayName?: string;
};

//===============================================================

function serialize(note: LeanNote, pictureUrl?: string) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt.toISOString(),

    author: {
      userId: String(note.createdBy),
      displayName: note.authorDisplayName?.trim() || 'Pharmacy owner',
      ...(pictureUrl ? { pictureUrl } : {}),
    },
  };
}

//===============================================================

export async function getOwnerProductRequestNotesService(
  actor: PharmacyInternalNotesActor,
  requestId: string,
  page: number,
  perPage: number
) {
  const { filter } = await resolveScope(actor, requestId, false);
  const total = await PharmacyNote.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);
  const safePage = totalPages ? Math.min(page, totalPages) : 1;

  const notes = await PharmacyNote.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * perPage)
    .limit(perPage)
    .lean<LeanNote[]>();

  const authors = await User.find({
    _id: { $in: notes.map((note) => note.createdBy) },
  })
    .select('_id pictureUrl')
    .lean<Array<{ _id: Types.ObjectId; pictureUrl?: string }>>();

  const pictures = new Map(
    authors.map((author) => [String(author._id), author.pictureUrl])
  );

  return {
    items: notes.map((note) =>
      serialize(note, pictures.get(String(note.createdBy)))
    ),

    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

export async function createOwnerProductRequestNoteService(
  actor: PharmacyInternalNotesActor,
  requestId: string,
  input: CreatePharmacyNoteInput
) {
  const { ownerId, requestObjectId } = await resolveScope(
    actor,
    requestId,
    true
  );

  const text = input.text.trim();

  const replayFilter = {
    ownerId,
    entityType: 'product_request' as const,
    entityId: requestObjectId,
    createdBy: new Types.ObjectId(actor.id),
    clientRequestId: input.clientRequestId,
  };

  const existing = await PharmacyNote.findOne(
    replayFilter
  ).lean<LeanNote | null>();

  if (existing) {
    if (existing.text !== text)
      throw httpError(HTTP_STATUS.CONFLICT, 'Comment key was already used.');

    return { note: serialize(existing) };
  }

  const author = await User.findById(actor.id)
    .select('name email pictureUrl')
    .lean<{ name?: string; email?: string; pictureUrl?: string } | null>();

  try {
    const note = await PharmacyNote.create({
      ...replayFilter,
      text,

      authorDisplayName:
        author?.name?.trim() || author?.email?.trim() || 'Pharmacy owner',
    });

    return { note: serialize(note, author?.pictureUrl) };
  } catch (error) {
    if (!hasMongoDuplicateKeyCode(error)) throw error;

    const replay = await PharmacyNote.findOne(
      replayFilter
    ).lean<LeanNote | null>();

    if (!replay) throw error;

    if (replay.text !== text)
      throw httpError(HTTP_STATUS.CONFLICT, 'Comment key was already used.');

    return { note: serialize(replay) };
  }
}

//===============================================================

export async function deleteOwnerProductRequestNoteService(
  actor: PharmacyInternalNotesActor,
  requestId: string,
  noteId: string
) {
  const { filter } = await resolveScope(actor, requestId, true);

  const removed = await PharmacyNote.findOneAndDelete({
    _id: noteId,
    ...filter,
  });

  if (!removed) throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment not found.');

  return { message: 'Comment deleted successfully.' };
}
