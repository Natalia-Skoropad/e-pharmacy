import { Router } from 'express';

import { getClientById, getClients } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { clientParamsSchema, clientsQuerySchema } from '../schemas/client.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const clientRoutes = Router();

//===============================================================

clientRoutes.use(authenticate);

//=================================================================================

clientRoutes.get('/', validate({ query: clientsQuerySchema }), ctrlWrapper(getClients));

//=================================================================================

clientRoutes.get(
  '/:clientId',
  validate({ params: clientParamsSchema }),
  ctrlWrapper(getClientById)
);
