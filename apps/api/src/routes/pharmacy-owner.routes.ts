import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';

import {
  deleteMyPharmacyOwnerDocument,
  downloadMyPharmacyOwnerDocument,
  listMyPharmacyOwnerDocuments,
  uploadMyPharmacyOwnerDocument,
  replaceMyPharmacyOwnerDocument,
} from '../controllers/pharmacy-owner-document.controller';

import {
  createMyPharmacyUserPrivateNote,
  deleteMyPharmacyUserPrivateNote,
  listMyPharmacyUserPrivateNotes,
} from '../controllers/pharmacy-user-private-note.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  pharmacyOwnerDocumentParamsSchema,
  pharmacyOwnerDocumentUploadSchema,
} from '../schemas/pharmacy-owner-document.schema';

import {
  createPharmacyUserPrivateNoteSchema,
  pharmacyUserPrivateNoteParamsSchema,
  pharmacyUserPrivateNotesQuerySchema,
} from '../schemas/pharmacy-user-private-note.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const pharmacyOwnerRoutes = Router();

//===============================================================

pharmacyOwnerRoutes.use(authenticate, authorizeRoles(USER_ROLES.PHARMACY));

//===============================================================

pharmacyOwnerRoutes.get(
  '/me/documents',
  ctrlWrapper(listMyPharmacyOwnerDocuments)
);

//===============================================================

pharmacyOwnerRoutes.post(
  '/me/documents',
  validate({ body: pharmacyOwnerDocumentUploadSchema }),
  ctrlWrapper(uploadMyPharmacyOwnerDocument)
);

//===============================================================

pharmacyOwnerRoutes.get(
  '/me/documents/:documentId',
  validate({ params: pharmacyOwnerDocumentParamsSchema }),
  ctrlWrapper(downloadMyPharmacyOwnerDocument)
);

//===============================================================

pharmacyOwnerRoutes.delete(
  '/me/documents/:documentId',
  validate({ params: pharmacyOwnerDocumentParamsSchema }),
  ctrlWrapper(deleteMyPharmacyOwnerDocument)
);

//===============================================================

pharmacyOwnerRoutes.put(
  '/me/documents/:documentId',

  validate({
    params: pharmacyOwnerDocumentParamsSchema,
    body: pharmacyOwnerDocumentUploadSchema,
  }),

  ctrlWrapper(replaceMyPharmacyOwnerDocument)
);

//===============================================================

// Personal notes are scoped only to req.user.id, including future employees.
pharmacyOwnerRoutes.get(
  '/me/comments',
  validate({ query: pharmacyUserPrivateNotesQuerySchema }),
  ctrlWrapper(listMyPharmacyUserPrivateNotes)
);

//===============================================================

pharmacyOwnerRoutes.post(
  '/me/comments',
  validate({ body: createPharmacyUserPrivateNoteSchema }),
  ctrlWrapper(createMyPharmacyUserPrivateNote)
);

//===============================================================

pharmacyOwnerRoutes.delete(
  '/me/comments/:commentId',
  validate({ params: pharmacyUserPrivateNoteParamsSchema }),
  ctrlWrapper(deleteMyPharmacyUserPrivateNote)
);
