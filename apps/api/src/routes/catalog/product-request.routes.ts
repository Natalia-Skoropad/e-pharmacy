import { Router } from 'express';

import {
  uploadProductRequestDocument,
  downloadProductRequestDocument,
} from '../../controllers/catalog/product-request-document.controller';

import {
  productRequestDocumentUploadSchema,
  productRequestDocumentParamsSchema,
} from '../../schemas/catalog/product-request-document.schema';

import {
  createProductRequest,
  deleteProductRequest,
  getProductRequestArticleAvailability,
  getProductRequestById,
  getProductRequestStatistics,
  getProductRequests,
  updateProductRequest,
  submitProductRequest,
  cancelProductRequest,
} from '../../controllers/catalog/product-request.controller';

import { USER_ROLES } from '../../constants/auth/auth';

import { authenticate } from '../../middlewares/auth/auth.middleware';
import { authorizeRoles } from '../../middlewares/auth/role.middleware';
import { validate } from '../../middlewares/http/validate.middleware';

import {
  productRequestArticleAvailabilityQuerySchema,
  productRequestFormSchema,
  productRequestParamsSchema,
  productRequestsQuerySchema,
} from '../../schemas/catalog/product-request.schema';

import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

//===============================================================

export const productRequestRoutes = Router();

//===============================================================

productRequestRoutes.use(authenticate);

//=================================================================================

productRequestRoutes.get(
  '/',
  validate({ query: productRequestsQuerySchema }),
  ctrlWrapper(getProductRequests)
);

//=================================================================================

productRequestRoutes.get(
  '/statistics',
  authorizeRoles(USER_ROLES.PHARMACY),
  ctrlWrapper(getProductRequestStatistics)
);

//=================================================================================

productRequestRoutes.get(
  '/article-availability',
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ query: productRequestArticleAvailabilityQuerySchema }),
  ctrlWrapper(getProductRequestArticleAvailability)
);

//=================================================================================

productRequestRoutes.post(
  '/documents',
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: productRequestDocumentUploadSchema }),
  ctrlWrapper(uploadProductRequestDocument)
);

//=================================================================================

productRequestRoutes.get(
  '/:requestId/documents/:documentId',
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ params: productRequestDocumentParamsSchema }),
  ctrlWrapper(downloadProductRequestDocument)
);

//=================================================================================

productRequestRoutes.get(
  '/:requestId',
  validate({ params: productRequestParamsSchema }),
  ctrlWrapper(getProductRequestById)
);

//=================================================================================

productRequestRoutes.post(
  '/',
  validate({ body: productRequestFormSchema }),
  ctrlWrapper(createProductRequest)
);

//=================================================================================

productRequestRoutes.patch(
  '/:requestId',
  validate({
    params: productRequestParamsSchema,
    body: productRequestFormSchema,
  }),
  ctrlWrapper(updateProductRequest)
);

//=================================================================================

productRequestRoutes.delete(
  '/:requestId',
  validate({ params: productRequestParamsSchema }),
  ctrlWrapper(deleteProductRequest)
);

//=================================================================================

productRequestRoutes.post(
  '/:requestId/submit',
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ params: productRequestParamsSchema }),
  ctrlWrapper(submitProductRequest)
);

//=================================================================================

productRequestRoutes.post(
  '/:requestId/cancel',
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ params: productRequestParamsSchema }),
  ctrlWrapper(cancelProductRequest)
);
