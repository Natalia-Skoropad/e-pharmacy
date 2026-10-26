import { Router } from 'express';

import {
  echoHealth,
  getHealth,
} from '../../controllers/health/health.controller';

import { validate } from '../../middlewares/http/validate.middleware';
import { healthEchoSchema } from '../../schemas/infrastructure/health.schema';
import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

//===============================================================

export const healthRoutes = Router();

//===============================================================

healthRoutes.get('/', ctrlWrapper(getHealth));

//=================================================================================

healthRoutes.post(
  '/echo',

  validate({
    body: healthEchoSchema,
  }),

  ctrlWrapper(echoHealth)
);
