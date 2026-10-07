import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';

import {
  deleteMyPharmacyOwnerDocument,
  downloadMyPharmacyOwnerDocument,
  listMyPharmacyOwnerDocuments,
  uploadMyPharmacyOwnerDocument,
} from '../controllers/pharmacy-owner-document.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  pharmacyOwnerDocumentParamsSchema,
  pharmacyOwnerDocumentUploadSchema,
} from '../schemas/pharmacy-owner-document.schema';

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
