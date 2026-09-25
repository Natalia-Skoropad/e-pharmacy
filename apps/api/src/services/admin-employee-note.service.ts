import { Types } from 'mongoose';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminEmployeePrivateNote } from '../models/adminEmployeePrivateNote.model';
import { User } from '../models/user.model';
import type { CreateAdminEmployeePrivateNoteInput } from '../schemas/admin-employee-note.schema';
import type { AdminAuthorization } from '../types/admin-access';
import { httpError } from '../utils/httpError';

//===============================================================

type PrivateNoteRecord = Readonly<{
  _id: Types.ObjectId;
  ownerUserId: Types.ObjectId;
  text: string;
  authorNameSnapshot: string;
  createdAt: Date;
}>;

//===============================================================

function assertSelfAdminAuthorization(
  userId: string,
  authorization: AdminAuthorization
): void {
  if (authorization.userId !== userId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access does not belong to the authenticated user.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }
}

//===============================================================

function serializePrivateNote(note: PrivateNoteRecord) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt.toISOString(),
    author: {
      userId: String(note.ownerUserId),
      displayName: note.authorNameSnapshot,
    },
  };
}

//===============================================================

function assertReplayMatches(
  note: Readonly<{ text: string }>,
  normalizedText: string
): void {
  if (note.text !== normalizedText) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===============================================================

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 11000
  );
}

//===============================================================

async function findPrivateNoteReplay(
  ownerUserId: string,
  clientRequestId: string
) {
  return AdminEmployeePrivateNote.findOne({
    ownerUserId,
    clientRequestId,
  }).lean<PrivateNoteRecord | null>();
}

//===============================================================

export async function listMyAdminEmployeePrivateNotesService(
  userId: string,
  authorization: AdminAuthorization,
  page: number,
  perPage: number
) {
  assertSelfAdminAuthorization(userId, authorization);

  const filter = { ownerUserId: userId };
  const total = await AdminEmployeePrivateNote.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const notes = await AdminEmployeePrivateNote.find(filter)
    .select('_id ownerUserId text authorNameSnapshot createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * perPage)
    .limit(perPage)
    .lean<PrivateNoteRecord[]>();

  return {
    items: notes.map(serializePrivateNote),
    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

export async function createMyAdminEmployeePrivateNoteService(
  userId: string,
  authorization: AdminAuthorization,
  input: CreateAdminEmployeePrivateNoteInput
) {
  assertSelfAdminAuthorization(userId, authorization);

  const normalizedText = input.text.trim();
  const existing = await findPrivateNoteReplay(userId, input.clientRequestId);

  if (existing) {
    assertReplayMatches(existing, normalizedText);
    return serializePrivateNote(existing);
  }

  const owner = await User.findOne({ _id: userId })
    .select('name email')
    .lean<{ name?: string; email?: string } | null>();

  const authorNameSnapshot =
    owner?.name?.trim() || owner?.email?.trim() || 'Admin employee';

  try {
    const note = await AdminEmployeePrivateNote.create({
      ownerUserId: userId,
      text: normalizedText,
      clientRequestId: input.clientRequestId,
      authorNameSnapshot,
    });

    return serializePrivateNote(note);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const replay = await findPrivateNoteReplay(userId, input.clientRequestId);
    if (!replay) throw error;

    assertReplayMatches(replay, normalizedText);
    return serializePrivateNote(replay);
  }
}

//===============================================================

export async function deleteMyAdminEmployeePrivateNoteService(
  userId: string,
  authorization: AdminAuthorization,
  commentId: string
): Promise<void> {
  assertSelfAdminAuthorization(userId, authorization);

  const deleted = await AdminEmployeePrivateNote.findOneAndDelete({
    _id: commentId,
    ownerUserId: userId,
  });

  if (!deleted) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Private comment was not found.');
  }
}
