import { Router } from 'express';

import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { cartRoutes } from './cart.routes';
import { healthRoutes } from './health.routes';
import { orderRoutes } from './order.routes';
import { productRequestRoutes } from './product-request.routes';
import { productRoutes } from './product.routes';
import { pharmacyRoutes } from './pharmacy.routes';

//===============================================================

export const routes = Router();

//===============================================================

routes.use('/admin', adminRoutes);
routes.use('/auth', authRoutes);
routes.use('/cart', cartRoutes);
routes.use('/health', healthRoutes);
routes.use('/orders', orderRoutes);
routes.use('/products', productRoutes);
routes.use('/product-requests', productRequestRoutes);
routes.use('/pharmacies', pharmacyRoutes);
routes.use('/pharmacy', pharmacyRoutes);
