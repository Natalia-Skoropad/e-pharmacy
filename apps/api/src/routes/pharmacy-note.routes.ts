import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
} from '../controllers/pharmacy-note.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createPharmacyNoteSchema,
  pharmacyNoteDeleteParamsSchema,
  pharmacyNoteParamsSchema,
  pharmacyNotesQuerySchema,
} from '../schemas/pharmacy-note.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const pharmacyNoteRoutes = Router();

//===============================================================

pharmacyNoteRoutes.use(authenticate, authorizeRoles(USER_ROLES.PHARMACY));

//===============================================================

pharmacyNoteRoutes.get(
  '/:entityType/:entityId',

  validate({
    params: pharmacyNoteParamsSchema,
    query: pharmacyNotesQuerySchema,
  }),

  ctrlWrapper(getPharmacyNotes)
);

//===============================================================

pharmacyNoteRoutes.post(
  '/:entityType/:entityId',

  validate({
    params: pharmacyNoteParamsSchema,
    body: createPharmacyNoteSchema,
  }),

  ctrlWrapper(createPharmacyNote)
);

//===============================================================

pharmacyNoteRoutes.delete(
  '/:entityType/:entityId/:noteId',
  validate({ params: pharmacyNoteDeleteParamsSchema }),
  ctrlWrapper(deletePharmacyNote)
);
