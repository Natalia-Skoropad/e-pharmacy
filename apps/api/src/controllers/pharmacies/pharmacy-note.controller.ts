import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  CreatePharmacyNoteInput,
  ClientNoteScopeQuery,
  PharmacyNoteDeleteParams,
  PharmacyNoteParams,
  PharmacyNotesQuery,
} from '../../schemas/pharmacies/pharmacy-note.schema';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
  getPharmacyNotesService,
} from '../../services/pharmacies/pharmacy-note.service';

import {
  getClientCardNotesService,
  createClientCardNoteService,
  deleteClientCardNoteService,
} from '../../services/clients/client-note.service';

import {
  getOwnerProductNotesService,
  createOwnerProductNoteService,
  deleteOwnerProductNoteService,
} from '../../services/products/owner-product-note.service';

import { httpError } from '../../utils/http/httpError';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

import type { ValidatedResponse } from '../../types/http/validated-request';

//===============================================================

export async function getPharmacyNotes(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyNoteParams, PharmacyNotesQuery>
) {
  const { params, query } = res.locals.validated;

  const user = req.user;

  if (!user) return;

  if (query.scope && query.scope !== params.entityType) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Client notes scope is only available for clients.'
    );
  }

  const data =
    query.scope === 'client'
      ? await getClientCardNotesService(
          { id: user.id, role: user.role },
          params.entityId,
          query.page,
          query.perPage
        )
      : query.scope === 'product'
        ? await getOwnerProductNotesService(
            { id: user.id, role: user.role },
            params.entityId,
            query.page,
            query.perPage
          )
        : await getPharmacyNotesService(
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

  res: ValidatedResponse<
    CreatePharmacyNoteInput,
    PharmacyNoteParams,
    ClientNoteScopeQuery
  >
) {
  const { body, params, query } = res.locals.validated;
  const user = req.user;

  if (!user) return;

  if (query.scope && query.scope !== params.entityType) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Client notes scope is only available for clients.'
    );
  }

  const data =
    query.scope === 'client'
      ? await createClientCardNoteService(
          { id: user.id, role: user.role },
          params.entityId,
          body
        )
      : query.scope === 'product'
        ? await createOwnerProductNoteService(
            { id: user.id, role: user.role },
            params.entityId,
            body
          )
        : await createPharmacyNoteService(
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

  res: ValidatedResponse<
    unknown,
    PharmacyNoteDeleteParams,
    ClientNoteScopeQuery
  >
) {
  const { params, query } = res.locals.validated;
  const user = req.user;

  if (!user) return;

  if (query.scope && query.scope !== params.entityType) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Client notes scope is only available for clients.'
    );
  }

  const data =
    query.scope === 'client'
      ? await deleteClientCardNoteService(
          { id: user.id, role: user.role },
          params.entityId,
          params.noteId
        )
      : query.scope === 'product'
        ? await deleteOwnerProductNoteService(
            { id: user.id, role: user.role },
            params.entityId,
            params.noteId
          )
        : await deletePharmacyNoteService(
            { id: user.id, role: user.role },

            params.entityType,
            params.entityId,
            params.noteId
          );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
