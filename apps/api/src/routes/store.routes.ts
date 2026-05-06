import { Router } from 'express';

import { getStoreDetails, getStores } from '../controllers/store.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  storeIdParamsSchema,
  storesQuerySchema,
} from '../schemas/store.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const storeRoutes = Router();

//===============================================================

storeRoutes.get(
  '/',
  validate({
    query: storesQuerySchema,
  }),
  ctrlWrapper(getStores)
);

storeRoutes.get(
  '/:storeId',
  validate({
    params: storeIdParamsSchema,
  }),
  ctrlWrapper(getStoreDetails)
);
