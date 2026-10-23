// S10.4: Canonical Auth login domain.
import { AUTH_ERROR_CODES, USER_STATUSES } from '../../constants/auth';
import { API_MESSAGES } from '../../constants/messages';
import { HTTP_STATUS } from '../../constants/httpStatus';

import { User } from '../../models/user.model';

import type { AuthSessionResult, LoginInput } from '../../types/auth';
import type { SessionContext } from '../../types/session';

import { httpError } from '../../utils/httpError';
import { comparePassword } from '../../utils/password';
import { buildAuthSessionResult } from './auth-sessions.service';

//===============================================================

// A fixed bcrypt hash prevents login timing from revealing unknown accounts.
const DUMMY_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

//===============================================================

export async function loginUserService(
  input: LoginInput,
  context?: SessionContext
): Promise<AuthSessionResult> {
  const user = await User.findOne({ email: input.email }).select('+password');

  const passwordHash =
    user && !user.isDefaultPharmacyClient ? user.password : DUMMY_PASSWORD_HASH;

  const isPasswordValid = await comparePassword(input.password, passwordHash);

  // Do not expose whether an email exists or which application owns it.
  // Application mismatch is intentionally indistinguishable from an unknown
  // account or wrong password.
  if (
    !user ||
    user.isDefaultPharmacyClient ||
    !isPasswordValid ||
    user.role !== input.application
  ) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_CREDENTIALS,
      undefined,

      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
  }

  // Blocked status is exposed only after the caller has proved knowledge of
  // the account password, avoiding status enumeration with arbitrary secrets.
  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.USER_BLOCKED,
      undefined,

      AUTH_ERROR_CODES.USER_BLOCKED
    );
  }

  return buildAuthSessionResult(user, context);
}
