import { createHash, randomBytes } from 'node:crypto';
import type { HydratedDocument } from 'mongoose';

import { env } from '../config/env';
import { USER_ROLES, USER_STATUSES, VENDOR_ACCOUNT_STATUSES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';

import type {
  AuthSessionResult,
  AuthTokens,
  AuthUserResponse,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  RegisterInput,
  UpdatePasswordInput,
  UpdateProfileInput,
} from '../types/auth';

import type { SessionContext } from '../types/session';
import type { UserEntity } from '../types/user';

import { httpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { parseDurationMs } from '../utils/duration';
import { isDuplicateEmailError } from '../utils/mongoError';
import { comparePassword, hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from '../utils/passwordResetEmail';
import { toAuthUserResponse } from '../utils/userResponse';

//===============================================================

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_TTL_MS = parseDurationMs(
  String(env.REFRESH_TOKEN_EXPIRES_IN),
  30 * 24 * 60 * 60 * 1000
);

//===============================================================

function createRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

//===============================================================

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

//===============================================================

function getRefreshTokenExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

//===============================================================

function sanitizeSessionContext(context?: SessionContext): SessionContext {
  return {
    ...(context?.userAgent
      ? { userAgent: context.userAgent.slice(0, 500) }
      : {}),
    ...(context?.ip ? { ip: context.ip.slice(0, 80) } : {}),
    ...(context?.deviceName
      ? { deviceName: context.deviceName.slice(0, 120) }
      : {}),
  };
}

//===============================================================

type UserDocument = HydratedDocument<UserEntity>;

//===============================================================

async function createAuthSession(
  user: UserDocument,
  context?: SessionContext
): Promise<AuthTokens> {
  const refreshToken = createRefreshToken();
  const safeContext = sanitizeSessionContext(context);

  const session = await Session.create({
    userId: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    roleAtLogin: user.role,
    expiresAt: getRefreshTokenExpiresAt(),
    lastUsedAt: new Date(),
    ...safeContext,
  });

  const accessToken = signToken({
    userId: String(user._id),
    role: user.role,
    sessionId: String(session._id),
  });

  return { accessToken, refreshToken };
}

//===============================================================

async function buildAuthSessionResult(
  user: UserDocument,
  context?: SessionContext
): Promise<AuthSessionResult> {
  const tokens = await createAuthSession(user, context);

  return {
    user: toAuthUserResponse(user),
    tokens,
  };
}

//===============================================================

export async function registerUserService(
  input: RegisterInput,
  context?: SessionContext
): Promise<AuthSessionResult> {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  const hashedPassword = await hashPassword(input.password);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role || USER_ROLES.CLIENT,
      vendorStatus:
        input.role === USER_ROLES.VENDOR
          ? VENDOR_ACCOUNT_STATUSES.NEW
          : undefined,
      phone: input.phone,
      address: input.address,
    });

    return buildAuthSessionResult(user, context);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }

    throw error;
  }
}

//===============================================================

export async function loginUserService(
  input: LoginInput,
  context?: SessionContext
): Promise<AuthSessionResult> {
  const user = await User.findOne({ email: input.email }).select('+password');

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.USER_BLOCKED);
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_CREDENTIALS);
  }

  return buildAuthSessionResult(user, context);
}

//===============================================================

export async function refreshAuthSessionService(
  refreshToken: string,
  context?: SessionContext
): Promise<AuthSessionResult> {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const now = new Date();

  let session = await Session.findOne({
    refreshTokenHash,
    revokedAt: undefined,
    expiresAt: { $gt: now },
  }).select('+refreshTokenHash +previousRefreshTokenHash');

  if (!session) {
    session = await Session.findOne({
      previousRefreshTokenHash: refreshTokenHash,
      previousRefreshTokenValidUntil: { $gt: now },
      revokedAt: undefined,
      expiresAt: { $gt: now },
    }).select('+refreshTokenHash +previousRefreshTokenHash');
  }

  if (!session) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_TOKEN);
  }

  const user = await User.findById(session.userId);

  if (!user) {
    session.revokedAt = new Date();
    await session.save();

    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    session.revokedAt = new Date();
    await session.save();

    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.USER_BLOCKED);
  }

  const safeContext = sanitizeSessionContext(context);

  session.lastUsedAt = new Date();
  if (safeContext.userAgent) session.userAgent = safeContext.userAgent;
  if (safeContext.ip) session.ip = safeContext.ip;
  if (safeContext.deviceName) session.deviceName = safeContext.deviceName;

  const tokens: AuthTokens = {
    accessToken: signToken({
      userId: String(user._id),
      role: user.role,
      sessionId: String(session._id),
    }),
    refreshToken,
  };

  // Keep the refresh token stable for the lifetime of this device session.
  //
  // The earlier implementation rotated the refresh token on every refresh and
  // accepted the previous token only for a short grace window. That is a good
  // security pattern when the server can safely return the latest raw refresh
  // token to every parallel request. Here we only store token hashes, so a
  // parallel request that arrived with the previous token could refresh the
  // access token but could not receive the already-rotated refresh token.
  // If that response was the last one applied by the browser, the browser kept
  // the stale refresh cookie and the next refresh failed with
  // "Authorization token is invalid".
  //
  // A stable per-device refresh token avoids that race and allows the same
  // account to stay signed in on several devices at the same time. Logout still
  // revokes only the current session, while logout-all/password reset/password
  // change revoke all sessions intentionally.
  session.previousRefreshTokenHash = undefined;
  session.previousRefreshTokenValidUntil = undefined;
  session.expiresAt = getRefreshTokenExpiresAt();

  await session.save();

  return {
    user: toAuthUserResponse(user),
    tokens,
  };
}

//===============================================================

export async function revokeCurrentSessionService(
  sessionId?: string
): Promise<void> {
  if (!sessionId) return;

  await Session.findOneAndUpdate(
    {
      _id: sessionId,
      revokedAt: undefined,
    },
    {
      $set: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    }
  );
}

//===============================================================

export async function revokeAllUserSessionsService(
  userId: string
): Promise<void> {
  await Session.updateMany(
    {
      userId,
      revokedAt: undefined,
    },
    {
      $set: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    }
  );
}

//===============================================================

export async function assertActiveSessionService(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await Session.exists({
    _id: sessionId,
    userId,
    revokedAt: undefined,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_TOKEN);
  }
}

//===============================================================

function buildPasswordResetUrl(token: string): string {
  const url = new URL('/reset-password', env.CLIENT_APP_URL);

  url.searchParams.set('token', token);

  return url.toString();
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
  const user = await User.findOne({ email: input.email });

  // Anti user enumeration: the controller returns the same 200 response
  // whether the account exists or not.
  if (!user || user.status === USER_STATUSES.BLOCKED) {
    return;
  }

  const resetToken = createPasswordResetToken();

  user.resetPasswordTokenHash = hashPasswordResetToken(resetToken);
  user.resetPasswordExpiresAt = getPasswordResetExpiresAt();

  await user.save();

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl: buildPasswordResetUrl(resetToken),
  });
}

//===============================================================

export async function resetPasswordService(
  input: ResetPasswordInput
): Promise<void> {
  const tokenHash = hashPasswordResetToken(input.token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password +resetPasswordTokenHash +resetPasswordExpiresAt');

  if (!user || user.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      API_MESSAGES.PASSWORD_RESET_TOKEN_INVALID
    );
  }

  user.password = await hashPassword(input.newPassword);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();
  await revokeAllUserSessionsService(String(user._id));
}

//===============================================================

export async function getUserByIdService(
  userId: string
): Promise<AuthUserResponse> {
  const user = await User.findById(userId);

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.USER_BLOCKED);
  }

  return toAuthUserResponse(user);
}

//===============================================================

export async function updateUserProfileService(
  userId: string,
  input: UpdateProfileInput
): Promise<AuthUserResponse> {
  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if (typeof input.name === 'string') update.name = input.name;

  if (typeof input.phone === 'string') update.phone = input.phone;

  if (typeof input.address === 'string') {
    if (input.address) update.address = input.address;
    else unset.address = '';
  }

  if ('pictureUrl' in input) {
    if (input.pictureUrl) update.pictureUrl = input.pictureUrl;
    else unset.pictureUrl = '';
  }

  const updateQuery: Record<string, unknown> = {};

  if (Object.keys(update).length > 0) updateQuery.$set = update;
  if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

  const user = await User.findByIdAndUpdate(userId, updateQuery, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  return toAuthUserResponse(user);
}

//===============================================================

export async function updateUserPasswordService(
  userId: string,
  input: UpdatePasswordInput
): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  const isCurrentPasswordValid = await comparePassword(
    input.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
  }

  user.password = await hashPassword(input.newPassword);
  await user.save();
  await revokeAllUserSessionsService(userId);
}
