import { Router } from 'express';

import {
  getClientById,
  getClientPurchasedProducts,
  getClientPharmacies,
  getClientOrderStatistics,
  getClientSalesStatistics,
  getClients,
} from '../../controllers/clients/client.controller';

import { authenticate } from '../../middlewares/auth/auth.middleware';
import { validate } from '../../middlewares/http/validate.middleware';

import {
  clientParamsSchema,
  clientDetailQuerySchema,
  clientProductsQuerySchema,
  clientsQuerySchema,
} from '../../schemas/clients/client.schema';

import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

import { orderSalesStatisticsQuerySchema } from '../../schemas/orders/order.schema';
import { ownedPharmacyRegistryListQuerySchema } from '../../schemas/owners/owned-pharmacy-registry.schema';

//===============================================================

export const clientRoutes = Router();

//===============================================================

clientRoutes.use(authenticate);

//===============================================================

clientRoutes.get(
  '/',
  validate({ query: clientsQuerySchema }),
  ctrlWrapper(getClients)
);

//===============================================================

clientRoutes.get(
  '/:clientId/pharmacies',

  validate({
    params: clientParamsSchema,
    query: ownedPharmacyRegistryListQuerySchema,
  }),

  ctrlWrapper(getClientPharmacies)
);

//===============================================================

clientRoutes.get(
  '/:clientId/order-statistics',
  validate({ params: clientParamsSchema }),
  ctrlWrapper(getClientOrderStatistics)
);

//===============================================================

clientRoutes.get(
  '/:clientId/sales-statistics',

  validate({
    params: clientParamsSchema,
    query: orderSalesStatisticsQuerySchema,
  }),

  ctrlWrapper(getClientSalesStatistics)
);

//===============================================================

clientRoutes.get(
  '/:clientId/products',
  validate({ params: clientParamsSchema, query: clientProductsQuerySchema }),
  ctrlWrapper(getClientPurchasedProducts)
);

//===============================================================

clientRoutes.get(
  '/:clientId',
  validate({ params: clientParamsSchema, query: clientDetailQuerySchema }),
  ctrlWrapper(getClientById)
);
