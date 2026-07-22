import { Router } from 'express';

import {
  createProductRequest,
  deleteProductRequest,
  getProductRequestArticleAvailability,
  getProductRequestById,
  getProductRequests,
  updateProductRequest,
} from '../controllers/product-request.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  productRequestArticleAvailabilityQuerySchema,
  productRequestFormSchema,
  productRequestParamsSchema,
  productRequestsQuerySchema,
} from '../schemas/product-request.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

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
  '/article-availability',
  validate({ query: productRequestArticleAvailabilityQuerySchema }),
  ctrlWrapper(getProductRequestArticleAvailability)
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
