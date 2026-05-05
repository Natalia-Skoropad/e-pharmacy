import { Router } from 'express';

import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';

//===============================================================

export const routes = Router();

//===============================================================

routes.use('/auth', authRoutes);
routes.use('/health', healthRoutes);
