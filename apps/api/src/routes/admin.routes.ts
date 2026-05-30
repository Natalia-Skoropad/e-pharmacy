import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';

import {
  createVendorUserByAdmin,
  updateShopStatusByAdmin,
  updateVendorStatusByAdmin,
} from '../controllers/admin.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createAdminVendorSchema,
  shopIdParamsSchema,
  updateAdminShopStatusSchema,
  updateAdminVendorStatusSchema,
  vendorIdParamsSchema,
} from '../schemas/admin.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const adminRoutes = Router();

//===============================================================

adminRoutes.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

adminRoutes.post(
  '/vendors',
  validate({ body: createAdminVendorSchema }),
  ctrlWrapper(createVendorUserByAdmin)
);

adminRoutes.patch(
  '/vendors/:vendorId/status',
  validate({ params: vendorIdParamsSchema, body: updateAdminVendorStatusSchema }),
  ctrlWrapper(updateVendorStatusByAdmin)
);

adminRoutes.patch(
  '/shops/:shopId/status',
  validate({ params: shopIdParamsSchema, body: updateAdminShopStatusSchema }),
  ctrlWrapper(updateShopStatusByAdmin)
);
