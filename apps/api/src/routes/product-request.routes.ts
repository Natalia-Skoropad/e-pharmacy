import { Router } from 'express';

import {
  createProductRequest,
  getProductRequests,
} from '../controllers/product-request.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createProductRequestSchema,
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

productRequestRoutes.post(
  '/',
  validate({ body: createProductRequestSchema }),
  ctrlWrapper(createProductRequest)
);
