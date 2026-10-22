import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { PharmacyUserPrivateNote } from '../../models/pharmacyUserPrivateNote.model';
import { User } from '../../models/user.model';

import type { CreatePharmacyUserPrivateNoteInput } from '../../schemas/pharmacy-user-private-note.schema';

import { httpError } from '../../utils/httpError';

import { hasMongoDuplicateKeyCode } from '../../utils/mongoError';

//===============================================================

type PrivateNoteRecord = Readonly<{
  _id: Types.ObjectId;
  ownerUserId: Types.ObjectId;
  text: string;
  authorNameSnapshot: string;
  createdAt: Date;
}>;

type PrivateNoteAuthor = Readonly<{
  name: string;
  email: string;
  pictureUrl?: string;
}>;

//===============================================================

function serializePrivateNote(note: PrivateNoteRecord, pictureUrl?: string) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt.toISOString(),

    author: {
      userId: String(note.ownerUserId),
      displayName: note.authorNameSnapshot,

      ...(pictureUrl ? { pictureUrl } : {}),
    },
  };
}

//===============================================================

function assertReplayMatches(note: PrivateNoteRecord, text: string): void {
  if (note.text !== text) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===============================================================

async function findReplay(userId: string, clientRequestId: string) {
  return PharmacyUserPrivateNote.findOne({
    ownerUserId: userId,
    clientRequestId,
  }).lean<PrivateNoteRecord | null>();
}

//===============================================================

async function getCurrentAuthor(userId: string): Promise<PrivateNoteAuthor> {
  const user = await User.findById(userId)
    .select('name email pictureUrl')
    .lean<PrivateNoteAuthor | null>();

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, 'User session is invalid.');
  }

  return user;
}

//===============================================================

export async function listMyPharmacyUserPrivateNotesService(
  userId: string,
  page: number,
  perPage: number
) {
  // Scope every read by the session user; no pharmacy membership lookup.
  const filter = { ownerUserId: userId };
  const total = await PharmacyUserPrivateNote.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const notes = await PharmacyUserPrivateNote.find(filter)
    .select('_id ownerUserId text authorNameSnapshot createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * perPage)
    .limit(perPage)
    .lean<PrivateNoteRecord[]>();

  const user = await getCurrentAuthor(userId);

  return {
    items: notes.map((note) => serializePrivateNote(note, user.pictureUrl)),
    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

export async function createMyPharmacyUserPrivateNoteService(
  userId: string,
  input: CreatePharmacyUserPrivateNoteInput
) {
  const text = input.text.trim();
  const replay = await findReplay(userId, input.clientRequestId);

  if (replay) {
    assertReplayMatches(replay, text);

    const user = await getCurrentAuthor(userId);

    return serializePrivateNote(replay, user.pictureUrl);
  }

  const user = await getCurrentAuthor(userId);
  const authorNameSnapshot = user.name.trim() || user.email.trim();

  try {
    const note = await PharmacyUserPrivateNote.create({
      ownerUserId: userId,
      text,
      clientRequestId: input.clientRequestId,
      authorNameSnapshot,
    });

    return serializePrivateNote(note, user.pictureUrl);
  } catch (error) {
    if (!hasMongoDuplicateKeyCode(error)) throw error;

    // The unique (ownerUserId, clientRequestId) index is the concurrency guard.
    const concurrentlyCreated = await findReplay(userId, input.clientRequestId);
    if (!concurrentlyCreated) throw error;

    assertReplayMatches(concurrentlyCreated, text);
    return serializePrivateNote(concurrentlyCreated, user.pictureUrl);
  }
}

//===============================================================

export async function deleteMyPharmacyUserPrivateNoteService(
  userId: string,
  commentId: string
): Promise<void> {
  const deleted = await PharmacyUserPrivateNote.findOneAndDelete({
    _id: commentId,
    ownerUserId: userId,
  });

  if (!deleted) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Private comment was not found.');
  }
}
