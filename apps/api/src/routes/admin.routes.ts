import { Router } from 'express';
import { USER_ROLES } from '../constants/auth';
import {
  createPharmacyUserByAdmin,
  updatePharmacyStatusByAdmin,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createAdminPharmacySchema,
  pharmacyIdParamsSchema,
  updateAdminPharmacyStatusSchema,
} from '../schemas/admin.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

export const adminRoutes = Router();
adminRoutes.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

adminRoutes.post(
  '/pharmacies',
  validate({ body: createAdminPharmacySchema }),
  ctrlWrapper(createPharmacyUserByAdmin)
);

adminRoutes.patch(
  '/pharmacies/:pharmacyId/status',
  validate({
    params: pharmacyIdParamsSchema,
    body: updateAdminPharmacyStatusSchema,
  }),
  ctrlWrapper(updatePharmacyStatusByAdmin)
);
