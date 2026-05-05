import { Router } from 'express';

import { getHealth } from '../controllers/health.controller';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const healthRoutes = Router();

//===============================================================

healthRoutes.get('/', ctrlWrapper(getHealth));
