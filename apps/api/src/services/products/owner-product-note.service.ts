import { Types } from 'mongoose';

import { USER_ROLES, USER_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { OwnerProductSelection } from '../../models/catalog/ownerProductSelection.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type { CreatePharmacyNoteInput } from '../../schemas/pharmacies/pharmacy-note.schema';

import { httpError } from '../../utils/http/httpError';
import { hasMongoDuplicateKeyCode } from '../../utils/database/mongoError';

import {
  canPharmacyMembershipUseCapability,
  listUserPharmacyMemberships,
  type PharmacyInternalNotesActor,
} from '../pharmacies/pharmacy-membership.service';

//===============================================================

// Owner-wide product comments use the same tenant boundary as client comments.
// A selected pharmacy is never used as an implicit authorization bypass.
async function resolveScope(
  actor: PharmacyInternalNotesActor,
  productId: string,
  mutate: boolean
) {
  if (
    actor.role !== USER_ROLES.PHARMACY ||
    !Types.ObjectId.isValid(productId)
  ) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product not found.');
  }

  const memberships = await listUserPharmacyMemberships(actor.id);

  const eligibleIds = memberships.pharmacies
    .filter(
      (member) =>
        member.membershipRole &&
        canPharmacyMembershipUseCapability(
          member.membershipRole,
          mutate ? 'manage_internal_notes' : 'read_internal_notes'
        ) &&
        (!mutate || member.status !== 'blocked')
    )
    .map((member) => new Types.ObjectId(member.id));

  const pharmacies = await Pharmacy.find({
    _id: { $in: eligibleIds },
    $or: [{ ownerId: actor.id }, { managerUserIds: actor.id }],
  })
    .select('_id ownerId')
    .lean<Array<{ _id: Types.ObjectId; ownerId: Types.ObjectId }>>();

  const ownerIds = [...new Set(pharmacies.map((item) => String(item.ownerId)))];

  const activeOwners = await User.find({
    _id: { $in: ownerIds.map((id) => new Types.ObjectId(id)) },
    role: USER_ROLES.PHARMACY,
    status: { $ne: USER_STATUSES.BLOCKED },
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const productObjectId = new Types.ObjectId(productId);

  const selected = await OwnerProductSelection.find({
    productId: productObjectId,
    ownerId: { $in: activeOwners.map((owner) => owner._id) },
  })
    .select('ownerId')
    .lean<Array<{ ownerId: Types.ObjectId }>>();

  const selectedOwners = new Set(
    selected.map((entry) => String(entry.ownerId))
  );

  // Older owner catalogs may contain offers but no selection row.
  const offeredOwnerIds = (
    await ProductOffer.aggregate<{ _id: Types.ObjectId }>([
      {
        $match: {
          productId: productObjectId,
          pharmacyId: { $in: pharmacies.map((entry) => entry._id) },
        },
      },
      {
        $lookup: {
          from: Pharmacy.collection.name,
          localField: 'pharmacyId',
          foreignField: '_id',
          as: '_ownerPharmacy',
        },
      },
      { $unwind: '$_ownerPharmacy' },
      { $group: { _id: '$_ownerPharmacy.ownerId' } },
    ])
  ).map((entry) => String(entry._id));

  const activeOwnerIds = new Set(
    activeOwners.map((owner) => String(owner._id))
  );

  const foundOwners = ownerIds.filter(
    (id) =>
      activeOwnerIds.has(id) &&
      (selectedOwners.has(id) || offeredOwnerIds.includes(id))
  );

  const ownerId = foundOwners.includes(actor.id)
    ? actor.id
    : foundOwners.length === 1
      ? foundOwners[0]
      : null;

  if (!ownerId)
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Product comments are unavailable for this account.'
    );

  const ownerObjectId = new Types.ObjectId(ownerId);

  const legacyPharmacyIds = (
    await Pharmacy.find({ ownerId: ownerObjectId })
      .select('_id')
      .lean<Array<{ _id: Types.ObjectId }>>()
  ).map((item) => item._id);

  return { ownerObjectId, productObjectId, legacyPharmacyIds };
}

//===============================================================

type ProductScope = Awaited<ReturnType<typeof resolveScope>>;

//===============================================================

function filterFor(scope: ProductScope) {
  return {
    entityType: 'product' as const,
    entityId: scope.productObjectId,

    $or: [
      { ownerId: scope.ownerObjectId },
      {
        ownerId: { $exists: false },
        pharmacyId: { $in: scope.legacyPharmacyIds },
      },
    ],
  };
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

function serialize(
  note: LeanNote,
  author?: { name?: string; pictureUrl?: string }
) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt.toISOString(),

    author: {
      userId: String(note.createdBy),

      displayName:
        author?.name?.trim() ||
        note.authorDisplayName?.trim() ||
        'Pharmacy member',

      ...(author?.pictureUrl ? { pictureUrl: author.pictureUrl } : {}),
    },
  };
}

//===============================================================

export async function getOwnerProductNotesService(
  actor: PharmacyInternalNotesActor,
  productId: string,
  page: number,
  perPage: number
) {
  const scope = await resolveScope(actor, productId, false);
  const filter = filterFor(scope);
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
    .select('_id name pictureUrl')
    .lean<Array<{ _id: Types.ObjectId; name?: string; pictureUrl?: string }>>();

  const authorsById = new Map(
    authors.map((author) => [String(author._id), author])
  );

  return {
    items: notes.map((note) =>
      serialize(note, authorsById.get(String(note.createdBy)))
    ),

    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

export async function createOwnerProductNoteService(
  actor: PharmacyInternalNotesActor,
  productId: string,
  input: CreatePharmacyNoteInput
) {
  const scope = await resolveScope(actor, productId, true);
  const text = input.text.trim();

  const replayFilter = {
    ownerId: scope.ownerObjectId,
    entityType: 'product' as const,
    entityId: scope.productObjectId,
    createdBy: new Types.ObjectId(actor.id),
    clientRequestId: input.clientRequestId,
  };

  const existing = await PharmacyNote.findOne(
    replayFilter
  ).lean<LeanNote | null>();

  if (existing) {
    if (existing.text !== text)
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Comment request key was already used.'
      );

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
        author?.name?.trim() || author?.email?.trim() || 'Pharmacy member',
    });

    return { note: serialize(note, author ?? undefined) };
  } catch (error) {
    if (!hasMongoDuplicateKeyCode(error)) throw error;

    const replay = await PharmacyNote.findOne(
      replayFilter
    ).lean<LeanNote | null>();

    if (!replay) throw error;

    if (replay.text !== text)
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Comment request key was already used.'
      );

    return { note: serialize(replay) };
  }
}

//===============================================================

export async function deleteOwnerProductNoteService(
  actor: PharmacyInternalNotesActor,
  productId: string,
  noteId: string
) {
  const scope = await resolveScope(actor, productId, true);

  const removed = await PharmacyNote.findOneAndDelete({
    _id: noteId,
    ...filterFor(scope),
  });

  if (!removed) throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment not found.');

  return { message: 'Comment deleted successfully.' };
}
