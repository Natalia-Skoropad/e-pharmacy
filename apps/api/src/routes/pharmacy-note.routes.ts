import { Router } from 'express';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
} from '../controllers/pharmacy-note.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const pharmacyNoteRoutes = Router();

//===============================================================
pharmacyNoteRoutes.use(authenticate);

//===============================================================

pharmacyNoteRoutes.get('/:entityType/:entityId', ctrlWrapper(getPharmacyNotes));

//===============================================================

pharmacyNoteRoutes.post(
  '/:entityType/:entityId',
  ctrlWrapper(createPharmacyNote)
);

//===============================================================

pharmacyNoteRoutes.delete(
  '/:entityType/:entityId/:noteId',
  ctrlWrapper(deletePharmacyNote)
);
