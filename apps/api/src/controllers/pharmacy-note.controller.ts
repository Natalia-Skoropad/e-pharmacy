import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  CreatePharmacyNoteInput,
  PharmacyNoteDeleteParams,
  PharmacyNoteParams,
  PharmacyNotesQuery,
} from '../schemas/pharmacy-note.schema';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
  getPharmacyNotesService,
} from '../services/pharmacy-note.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getPharmacyNotes(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyNoteParams, PharmacyNotesQuery>
) {
  const { params, query } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await getPharmacyNotesService(
    { id: user.id, role: user.role },
    params.entityType,
    params.entityId,
    query.page,
    query.perPage
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createPharmacyNote(
  req: Request,
  res: ValidatedResponse<CreatePharmacyNoteInput, PharmacyNoteParams>
) {
  const { body, params } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await createPharmacyNoteService(
    { id: user.id, role: user.role },
    params.entityType,
    params.entityId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function deletePharmacyNote(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyNoteDeleteParams>
) {
  const { params } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await deletePharmacyNoteService(
    { id: user.id, role: user.role },
    params.entityType,
    params.entityId,
    params.noteId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
