import { Router } from 'express';

import { USER_ROLES } from '../constants/auth';

import {
  getAdminOnlyTest,
  getCurrentUser,
  getCustomerOnlyTest,
  getVendorOnlyTest,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const authRoutes = Router();

//===============================================================

authRoutes.post(
  '/register',
  validate({
    body: registerSchema,
  }),
  ctrlWrapper(registerUser)
);

authRoutes.post(
  '/login',
  validate({
    body: loginSchema,
  }),
  ctrlWrapper(loginUser)
);

authRoutes.get('/current', authenticate, ctrlWrapper(getCurrentUser));

authRoutes.post('/logout', authenticate, ctrlWrapper(logoutUser));

// Temporary role test routes.
// They will be removed or moved when real customer/vendor/admin modules appear.

authRoutes.get(
  '/test/customer',
  authenticate,
  authorizeRoles(USER_ROLES.CUSTOMER),
  ctrlWrapper(getCustomerOnlyTest)
);

authRoutes.get(
  '/test/vendor',
  authenticate,
  authorizeRoles(USER_ROLES.VENDOR),
  ctrlWrapper(getVendorOnlyTest)
);

authRoutes.get(
  '/test/admin',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  ctrlWrapper(getAdminOnlyTest)
);
