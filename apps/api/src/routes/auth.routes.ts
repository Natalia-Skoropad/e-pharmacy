import { Router } from 'express';

import { env } from '../config/env';
import { USER_ROLES } from '../constants/auth';

import {
  getAdminOnlyTest,
  getCurrentUser,
  getClientOnlyTest,
  getPharmacyOnlyTest,
  loginUser,
  logoutAllUserSessions,
  getActiveSessions,
  revokeActiveSession,
  logoutUser,
  refreshAuthSession,
  requestPasswordReset,
  registerUser,
  resetPassword,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '../controllers/auth.controller';

import { authenticate } from '../middlewares/auth.middleware';

import {
  authRateLimit,
  passwordResetRateLimit,
} from '../middlewares/rateLimit.middleware';

import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const authRoutes = Router();

//===============================================================

authRoutes.post(
  '/register',
  authRateLimit,
  validate({
    body: registerSchema,
  }),
  ctrlWrapper(registerUser)
);

//=================================================================================

authRoutes.post(
  '/login',
  authRateLimit,
  validate({
    body: loginSchema,
  }),
  ctrlWrapper(loginUser)
);

//=================================================================================

authRoutes.post('/refresh', ctrlWrapper(refreshAuthSession));

//=================================================================================

authRoutes.post(
  '/password-reset/request',
  passwordResetRateLimit,
  validate({
    body: forgotPasswordSchema,
  }),
  ctrlWrapper(requestPasswordReset)
);

//=================================================================================

authRoutes.post(
  '/password-reset/confirm',
  passwordResetRateLimit,
  validate({
    body: resetPasswordSchema,
  }),
  ctrlWrapper(resetPassword)
);

//=================================================================================

authRoutes.get('/current', authenticate, ctrlWrapper(getCurrentUser));

//=================================================================================

authRoutes.patch(
  '/current',
  authenticate,
  validate({
    body: updateProfileSchema,
  }),
  ctrlWrapper(updateCurrentUser)
);

//=================================================================================

authRoutes.patch(
  '/current/password',
  authenticate,
  validate({
    body: updatePasswordSchema,
  }),
  ctrlWrapper(updateCurrentUserPassword)
);

//=================================================================================

authRoutes.post('/logout', ctrlWrapper(logoutUser));

//=================================================================================

authRoutes.get('/sessions', authenticate, ctrlWrapper(getActiveSessions));

//=================================================================================

authRoutes.delete(
  '/sessions/:sessionId',
  authenticate,
  ctrlWrapper(revokeActiveSession)
);

//=================================================================================

authRoutes.post(
  '/logout-all',
  authenticate,
  ctrlWrapper(logoutAllUserSessions)
);

//===============================================================

// Temporary role test routes are available only outside production.
if (env.NODE_ENV !== 'production') {
  authRoutes.get(
    '/test/client',
    authenticate,
    authorizeRoles(USER_ROLES.CLIENT),
    ctrlWrapper(getClientOnlyTest)
  );

  authRoutes.get(
    '/test/pharmacy',
    authenticate,
    authorizeRoles(USER_ROLES.PHARMACY),
    ctrlWrapper(getPharmacyOnlyTest)
  );

  authRoutes.get(
    '/test/admin',
    authenticate,
    authorizeRoles(USER_ROLES.ADMIN),
    ctrlWrapper(getAdminOnlyTest)
  );
}
