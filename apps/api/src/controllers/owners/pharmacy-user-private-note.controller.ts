import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  CreatePharmacyUserPrivateNoteInput,
  PharmacyUserPrivateNoteParams,
  PharmacyUserPrivateNotesQuery,
} from '../../schemas/pharmacies/pharmacy-user-private-note.schema';

import {
  createMyPharmacyUserPrivateNoteService,
  deleteMyPharmacyUserPrivateNoteService,
  listMyPharmacyUserPrivateNotesService,
} from '../../services/owners/pharmacy-user-private-note.service';

import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/apiResponse';
import { httpError } from '../../utils/httpError';

//===============================================================

function requireAuthenticatedUserId(req: Request): string {
  if (!req.user?.id) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  return req.user.id;
}

//===============================================================

export async function listMyPharmacyUserPrivateNotes(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmacyUserPrivateNotesQuery>
): Promise<void> {
  const userId = requireAuthenticatedUserId(req);
  const { page, perPage } = res.locals.validated.query;

  const data = await listMyPharmacyUserPrivateNotesService(
    userId,
    page,
    perPage
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createMyPharmacyUserPrivateNote(
  req: Request,
  res: ValidatedResponse<CreatePharmacyUserPrivateNoteInput>
): Promise<void> {
  const userId = requireAuthenticatedUserId(req);

  const note = await createMyPharmacyUserPrivateNoteService(
    userId,
    res.locals.validated.body
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Private comment was created successfully.',
    data: { note },
  });
}

//===============================================================

export async function deleteMyPharmacyUserPrivateNote(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyUserPrivateNoteParams>
): Promise<void> {
  const userId = requireAuthenticatedUserId(req);
  const { commentId } = res.locals.validated.params;

  await deleteMyPharmacyUserPrivateNoteService(userId, commentId);

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
