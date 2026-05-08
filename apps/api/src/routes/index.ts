import { Router } from 'express';

import { authRoutes } from './auth.routes';
import { cartRoutes } from './cart.routes';
import { healthRoutes } from './health.routes';
import { productRoutes } from './product.routes';
import { storeRoutes } from './store.routes';

//===============================================================

export const routes = Router();

//===============================================================

routes.use('/auth', authRoutes);
routes.use('/cart', cartRoutes);
routes.use('/health', healthRoutes);
routes.use('/products', productRoutes);
routes.use('/stores', storeRoutes);
