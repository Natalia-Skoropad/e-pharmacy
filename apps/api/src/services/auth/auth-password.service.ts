// S10.4: Canonical Auth password domain.
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../../config/env';

import { AUTH_ERROR_CODES, USER_STATUSES } from '../../constants/auth';
import { API_MESSAGES } from '../../constants/messages';
import { HTTP_STATUS } from '../../constants/httpStatus';

import { User } from '../../models/accounts/user.model';

import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../../types/auth';

import { httpError } from '../../utils/httpError';
import { parseDurationMs } from '../../utils/duration';
import { comparePassword, hashPassword } from '../../utils/password';
import { logger } from '../../utils/logger';
import { resolvePasswordResetAppUrl } from '../../utils/password-reset-app-url';
import { buildPasswordResetUrl } from '../../utils/password-reset-url';
import { sendPasswordResetEmail } from '../../utils/passwordResetEmail';

import {
  enforcePasswordResetResponseTiming,
  startPasswordResetResponseTiming,
} from './auth-response-timing';

import { revokeAllUserSessionsService } from './auth-sessions.service';

//===============================================================

function createPasswordResetUrl(
  token: string,
  application: ForgotPasswordInput['application']
): string {
  const appUrl = resolvePasswordResetAppUrl(application, {
    client: env.CLIENT_APP_URL,
    pharmacy: env.PHARMACY_APP_URL,
    admin: env.ADMIN_APP_URL,
  });

  return buildPasswordResetUrl(appUrl, token);
}

//===============================================================

function createPasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

//===============================================================

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

//===============================================================

function getPasswordResetExpiresAt(): Date {
  return new Date(
    Date.now() +
      parseDurationMs(String(env.JWT_RESET_EXPIRES_IN), 15 * 60 * 1000)
  );
}

//===============================================================

export async function requestPasswordResetService(
  input: ForgotPasswordInput
): Promise<void> {
  const responseStartedAt = startPasswordResetResponseTiming();

  try {
    const user = await User.findOne({ email: input.email });

    // Anti user enumeration: the controller returns the same 200 response
    // whether the account exists or not. Application is an issuance gate: a
    // reset secret is created only when the selected application matches the
    // account role. Confirmation is then authorized by the opaque, single-use
    // reset secret itself; there is no second stale application claim.
    if (
      !user ||
      user.status === USER_STATUSES.BLOCKED ||
      user.role !== input.application
    ) {
      return;
    }

    const resetToken = createPasswordResetToken();

    user.resetPasswordTokenHash = hashPasswordResetToken(resetToken);
    user.resetPasswordExpiresAt = getPasswordResetExpiresAt();

    await user.save();

    const resetUrl = createPasswordResetUrl(resetToken, input.application);

    // Do not keep the password recovery request open while SMTP connects.
    // The reset token is already saved, so the API can return the same
    // anti-enumeration success response immediately. SMTP failures are logged
    // for diagnostics without blocking the user-facing flow.
    void sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    }).catch((error) => {
      logger.error('[auth] Password reset email sending failed', error);
    });
  } finally {
    // Existing, unknown, blocked, and wrong-application accounts share the
    // same minimum response floor plus bounded jitter. This keeps the outward
    // 200 envelope generic without making tests depend on real wall-clock waits.
    await enforcePasswordResetResponseTiming(responseStartedAt);
  }
}

//===============================================================

export async function resetPasswordService(
  input: ResetPasswordInput
): Promise<void> {
  const tokenHash = hashPasswordResetToken(input.token);
  const hashedPassword = await hashPassword(input.newPassword);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Compare-and-consume the reset token in the same transaction that
      // changes the password and revokes sessions. Two concurrent requests
      // with the same token cannot both commit successfully.
      const user = await User.findOneAndUpdate(
        {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpiresAt: { $gt: new Date() },
          status: { $ne: USER_STATUSES.BLOCKED },
        },
        {
          $set: { password: hashedPassword },

          $unset: {
            resetPasswordTokenHash: '',
            resetPasswordExpiresAt: '',
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!user) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          API_MESSAGES.PASSWORD_RESET_TOKEN_INVALID,
          undefined,

          AUTH_ERROR_CODES.RESET_TOKEN_INVALID
        );
      }

      await revokeAllUserSessionsService(
        String(user._id),
        'password_changed',
        session
      );
    });
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updateUserPasswordService(
  userId: string,
  input: UpdatePasswordInput
): Promise<void> {
  const hashedPassword = await hashPassword(input.newPassword);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId)
        .select('+password')
        .session(session);

      if (!user) {
        throw httpError(
          HTTP_STATUS.UNAUTHORIZED,
          API_MESSAGES.USER_NOT_FOUND,
          undefined,

          AUTH_ERROR_CODES.SESSION_INVALID
        );
      }

      const isCurrentPasswordValid = await comparePassword(
        input.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw httpError(
          HTTP_STATUS.UNAUTHORIZED,
          'Current password is incorrect',
          undefined,

          AUTH_ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      user.password = hashedPassword;

      await user.save({ session });
      await revokeAllUserSessionsService(userId, 'password_changed', session);
    });
  } finally {
    await session.endSession();
  }
}
