import { Router } from 'express';

import { env } from '../config/env';
import { AUTH_ERROR_CODES, USER_ROLES } from '../constants/auth';

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
  uploadRegistrationPharmacyDocument,
  resetPassword,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '../controllers/auth.controller';

import { authenticate } from '../middlewares/auth.middleware';

import {
  loginAccountRateLimit,
  loginIpRateLimit,
  loginProgressiveDelay,
  passwordChangeAccountRateLimit,
  passwordChangeIpRateLimit,
  passwordChangeProgressiveDelay,
  passwordResetAccountRateLimit,
  passwordResetConfirmIpRateLimit,
  passwordResetRequestIpRateLimit,
  passwordResetTokenRateLimit,
  registrationAccountRateLimit,
  registrationDocumentIpRateLimit,
  registrationIpRateLimit,
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
  uploadRegistrationPharmacyDocumentSchema,
} from '../schemas/auth.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const authRoutes = Router();

//===============================================================

function validateAuth(schemas: Parameters<typeof validate>[0]) {
  return validate({
    ...schemas,
    errorCode: AUTH_ERROR_CODES.VALIDATION_FAILED,
  });
}

//===============================================================

authRoutes.post(
  '/pharmacy-documents',
  registrationDocumentIpRateLimit,
  validateAuth({ body: uploadRegistrationPharmacyDocumentSchema }),
  ctrlWrapper(uploadRegistrationPharmacyDocument)
);

//=================================================================================

authRoutes.post(
  '/register',
  registrationIpRateLimit,
  validateAuth({
    body: registerSchema,
  }),
  registrationAccountRateLimit,
  ctrlWrapper(registerUser)
);

//=================================================================================

authRoutes.post(
  '/login',
  loginIpRateLimit,
  validateAuth({
    body: loginSchema,
  }),
  loginProgressiveDelay,
  loginAccountRateLimit,
  ctrlWrapper(loginUser)
);

//=================================================================================

authRoutes.post('/refresh', ctrlWrapper(refreshAuthSession));

//=================================================================================

authRoutes.post(
  '/password-reset/request',
  passwordResetRequestIpRateLimit,
  validateAuth({
    body: forgotPasswordSchema,
  }),
  passwordResetAccountRateLimit,
  ctrlWrapper(requestPasswordReset)
);

//=================================================================================

authRoutes.post(
  '/password-reset/confirm',
  passwordResetConfirmIpRateLimit,
  validateAuth({
    body: resetPasswordSchema,
  }),
  passwordResetTokenRateLimit,
  ctrlWrapper(resetPassword)
);

//=================================================================================

authRoutes.get('/current', authenticate, ctrlWrapper(getCurrentUser));

//=================================================================================

authRoutes.patch(
  '/current',
  authenticate,
  validateAuth({
    body: updateProfileSchema,
  }),
  ctrlWrapper(updateCurrentUser)
);

//=================================================================================

authRoutes.patch(
  '/current/password',
  authenticate,
  passwordChangeIpRateLimit,
  validateAuth({
    body: updatePasswordSchema,
  }),
  passwordChangeProgressiveDelay,
  passwordChangeAccountRateLimit,
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

authRoutes.post('/logout-all', ctrlWrapper(logoutAllUserSessions));

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
