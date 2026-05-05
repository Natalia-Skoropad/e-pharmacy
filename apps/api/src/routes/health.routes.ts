import { Router } from 'express';

import { echoHealth, getHealth } from '../controllers/health.controller';
import { validate } from '../middlewares/validate.middleware';
import { healthEchoSchema } from '../schemas/health.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const healthRoutes = Router();

//===============================================================

healthRoutes.get('/', ctrlWrapper(getHealth));

healthRoutes.post(
  '/echo',
  validate({
    body: healthEchoSchema,
  }),
  ctrlWrapper(echoHealth)
);
