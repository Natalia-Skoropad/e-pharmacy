import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createPharmacyNoteSchema,
  pharmacyNoteDeleteParamsSchema,
  pharmacyNoteParamsSchema,
  pharmacyNotesQuerySchema,
} from '../schemas/pharmacy-note.schema';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
  getPharmacyNotesService,
} from '../services/pharmacy-note.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getPharmacyNotes(req: Request, res: Response) {
  const params = pharmacyNoteParamsSchema.parse(req.params);
  const query = pharmacyNotesQuerySchema.parse(req.query);
  const data = await getPharmacyNotesService(
    req.user?.id ?? '',
    params.entityType,
    params.entityId,
    query.page,
    query.perPage
  );
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createPharmacyNote(req: Request, res: Response) {
  const params = pharmacyNoteParamsSchema.parse(req.params);
  const body = createPharmacyNoteSchema.parse(req.body);
  const data = await createPharmacyNoteService(
    req.user?.id ?? '',
    params.entityType,
    params.entityId,
    body.text
  );
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function deletePharmacyNote(req: Request, res: Response) {
  const params = pharmacyNoteDeleteParamsSchema.parse(req.params);
  const data = await deletePharmacyNoteService(
    req.user?.id ?? '',
    params.entityType,
    params.entityId,
    params.noteId
  );
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
