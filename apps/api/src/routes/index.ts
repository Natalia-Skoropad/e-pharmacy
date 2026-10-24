import { pharmacyNoteRoutes } from './pharmacy-note.routes';

import { Router } from 'express';

import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth/auth.routes';
import { cartRoutes } from './cart/cart.routes';
import { clientRoutes } from './clients/client.routes';
import { healthRoutes } from './health/health.routes';
import { orderRoutes } from './orders/order.routes';

import { productCategoryRoutes } from './catalog/product-category.routes';
import { productRequestRoutes } from './catalog/product-request.routes';
import { productRoutes } from './catalog/product.routes';

import { pharmacyRoutes } from './pharmacy.routes';
import { pharmacyOwnerRoutes } from './pharmacy-owner.routes';

//===============================================================

export const routes = Router();

//===============================================================

routes.use('/admin', adminRoutes);
routes.use('/auth', authRoutes);
routes.use('/cart', cartRoutes);
routes.use('/clients', clientRoutes);
routes.use('/pharmacy-notes', pharmacyNoteRoutes);
routes.use('/health', healthRoutes);
routes.use('/orders', orderRoutes);

routes.use('/products', productRoutes);
routes.use('/product-categories', productCategoryRoutes);
routes.use('/product-requests', productRequestRoutes);

routes.use('/pharmacies', pharmacyRoutes);
routes.use('/pharmacy-owners', pharmacyOwnerRoutes);
routes.use('/pharmacy', pharmacyRoutes);
