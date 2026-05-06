import { Router } from 'express';

import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { productRoutes } from './product.routes';
import { storeRoutes } from './store.routes';

//===============================================================

export const routes = Router();

//===============================================================

routes.use('/auth', authRoutes);
routes.use('/health', healthRoutes);
routes.use('/products', productRoutes);
routes.use('/stores', storeRoutes);
