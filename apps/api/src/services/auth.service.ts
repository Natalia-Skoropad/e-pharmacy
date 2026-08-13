import { createHash, randomBytes } from 'node:crypto';
import mongoose, { type ClientSession, type HydratedDocument } from 'mongoose';

import { env } from '../config/env';

import { AUTH_ERROR_CODES, USER_ROLES, USER_STATUSES } from '../constants/auth';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import { Session } from '../models/session.model';
import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
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

import type {
  SessionContext,
  SessionResponseDto,
  SessionRevokedReason,
} from '../types/session';

import type { UserEntity } from '../types/user';

import { httpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { parseDurationMs } from '../utils/duration';

import {
  isDuplicateEmailError,
  isDuplicatePhoneError,
} from '../utils/mongoError';

import { comparePassword, hashPassword } from '../utils/password';
import { logger } from '../utils/logger';
import { sendPasswordResetEmail } from '../utils/passwordResetEmail';
import { toAuthUserResponse } from '../utils/userResponse';
import { claimRegistrationPharmacyDocuments } from './pharmacy-document.service';

//===============================================================

const REFRESH_TOKEN_BYTES = 64;

// Use one valid bcrypt hash for unknown-account login attempts so credential
// verification has the same expensive code path without revealing whether an
// email exists. The hash does not correspond to a real account.
const DUMMY_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const ACCESS_TOKEN_TTL_SECONDS = Math.max(
  1,
  Math.floor(parseDurationMs(String(env.JWT_EXPIRES_IN), 15 * 60 * 1000) / 1000)
);

const REFRESH_TOKEN_TTL_MS = parseDurationMs(
  String(env.REFRESH_TOKEN_EXPIRES_IN),
  30 * 24 * 60 * 60 * 1000
);

const REFRESH_TOKEN_TTL_SECONDS = Math.max(
  1,
  Math.floor(REFRESH_TOKEN_TTL_MS / 1000)
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

function normalizePhoneForLookup(phone: string): string {
  return phone.trim();
}

//===============================================================

async function ensurePhoneIsAvailable(
  phone: string,
  excludeUserId?: string
): Promise<void> {
  const normalizedPhone = normalizePhoneForLookup(phone);

  const existingPhoneOwner = await User.exists({
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    phone: normalizedPhone,
  });

  if (existingPhoneOwner) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      API_MESSAGES.PHONE_IN_USE,
      undefined,
      AUTH_ERROR_CODES.PHONE_CONFLICT
    );
  }
}

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

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
  };
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
  const phone = normalizePhoneForLookup(input.phone);
  const existingUserWithEmail = await User.exists({ email: input.email });

  if (existingUserWithEmail) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      API_MESSAGES.EMAIL_IN_USE,
      undefined,
      AUTH_ERROR_CODES.EMAIL_CONFLICT
    );
  }

  await ensurePhoneIsAvailable(phone);

  const hashedPassword = await hashPassword(input.password);
  const mongoSession = await mongoose.startSession();
  let user: UserDocument | null = null;

  try {
    user =
      (await mongoSession.withTransaction(async () => {
        const [createdUser] = await User.create(
          [
            {
              name: input.name,
              email: input.email,
              password: hashedPassword,
              role: input.role || USER_ROLES.CLIENT,
              phone,
              address: input.address,
            },
          ],
          { session: mongoSession }
        );

        if (createdUser.role === USER_ROLES.CLIENT) {
          await Client.create([{ userId: createdUser._id }], {
            session: mongoSession,
          });
        } else if (createdUser.role === USER_ROLES.PHARMACY) {
          const [createdPharmacy] = await Pharmacy.create(
            [
              {
                ownerId: createdUser._id,
                managerUserIds: [],
                name: '',
                phone: createdUser.phone,
                email: createdUser.email,
                documents: [],
                status: 'new',
              },
            ],
            { session: mongoSession }
          );

          const documents = await claimRegistrationPharmacyDocuments(
            input.pharmacyDocuments ?? [],
            createdPharmacy._id,
            createdUser._id,
            mongoSession
          );

          createdPharmacy.documents = documents;
          await createdPharmacy.save({ session: mongoSession });
        }

        return createdUser;
      })) ?? null;
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.EMAIL_IN_USE,
        undefined,
        AUTH_ERROR_CODES.EMAIL_CONFLICT
      );
    }

    if (isDuplicatePhoneError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.PHONE_IN_USE,
        undefined,
        AUTH_ERROR_CODES.PHONE_CONFLICT
      );
    }

    throw error;
  } finally {
    await mongoSession.endSession();
  }

  if (!user) {
    throw new Error('Registration transaction completed without a user.');
  }

  try {
    // Session creation intentionally happens after the identity transaction.
    // A transient session write failure must not roll back a successfully
    // registered User + Client/Pharmacy pair; the user can sign in normally.
    return await buildAuthSessionResult(user, context);
  } catch (error) {
    logger.error('[auth] Registration succeeded but session creation failed', {
      userId: String(user._id),
      error,
    });

    throw httpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      API_MESSAGES.REGISTRATION_SESSION_FAILED,
      undefined,
      AUTH_ERROR_CODES.REGISTRATION_SESSION_FAILED
    );
  }
}

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
    (input.application !== undefined && user.role !== input.application)
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
    const knownSession = await Session.findOne({
      $or: [
        { refreshTokenHash },
        { previousRefreshTokenHash: refreshTokenHash },
      ],
    }).select('revokedAt expiresAt');

    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      knownSession?.revokedAt
        ? AUTH_ERROR_CODES.SESSION_REVOKED
        : AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  const user = await User.findById(session.userId);

  if (!user) {
    session.revokedAt = new Date();
    await session.save();

    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.USER_NOT_FOUND,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    session.revokedAt = new Date();
    session.revokedReason = 'user_blocked';
    await session.save();

    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.USER_BLOCKED,
      undefined,
      AUTH_ERROR_CODES.USER_BLOCKED
    );
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
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
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

export async function revokeSessionByRefreshTokenService(
  refreshToken: string,
  reason: SessionRevokedReason = 'logout'
): Promise<void> {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await Session.findOneAndUpdate(
    {
      $or: [
        { refreshTokenHash },
        { previousRefreshTokenHash: refreshTokenHash },
      ],
      revokedAt: undefined,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason,
        lastUsedAt: new Date(),
      },
    }
  );
}

//===============================================================

export async function revokeAllUserSessionsService(
  userId: string,
  reason: SessionRevokedReason = 'logout_all',
  session?: ClientSession
): Promise<void> {
  await Session.updateMany(
    {
      userId,
      revokedAt: undefined,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason,
        lastUsedAt: new Date(),
      },
    },
    { session }
  );
}

//===============================================================

export async function assertActiveSessionService(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await Session.findOne({
    _id: sessionId,
    userId,
  })
    .select('revokedAt expiresAt')
    .lean();

  if (!session || session.expiresAt <= new Date()) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  if (session.revokedAt) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_REVOKED
    );
  }
}

//===============================================================

function getPasswordResetAppUrl(
  application: ForgotPasswordInput['application']
): string {
  const appUrls = {
    client: env.CLIENT_APP_URL,
    pharmacy: env.CLIENT_APP_URL,
    admin: env.ADMIN_APP_URL,
  } satisfies Record<ForgotPasswordInput['application'], string | undefined>;

  const appUrl = appUrls[application];

  if (!appUrl) {
    throw new Error(
      `Password reset URL is not configured for application: ${application}`
    );
  }

  return appUrl;
}

//===============================================================

function buildPasswordResetUrl(
  token: string,
  application: ForgotPasswordInput['application']
): string {
  const url = new URL('/reset-password', getPasswordResetAppUrl(application));

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
  // whether the account exists or not. The selected application still scopes
  // the reset token, so a client login cannot reset a pharmacy account and
  // vice versa.
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
  user.resetPasswordApplication = input.application;

  await user.save();

  const resetUrl = buildPasswordResetUrl(resetToken, input.application);

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
            resetPasswordApplication: '',
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

export async function getUserByIdService(
  userId: string
): Promise<AuthUserResponse> {
  const user = await User.findById(userId);

  if (!user) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.USER_NOT_FOUND,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.USER_BLOCKED,
      undefined,
      AUTH_ERROR_CODES.USER_BLOCKED
    );
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

  if (typeof input.phone === 'string') {
    const phone = normalizePhoneForLookup(input.phone);

    await ensurePhoneIsAvailable(phone, userId);

    update.phone = phone;
  }

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

  try {
    const user = await User.findByIdAndUpdate(userId, updateQuery, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!user) {
      throw httpError(
        HTTP_STATUS.UNAUTHORIZED,
        API_MESSAGES.USER_NOT_FOUND,
        undefined,
        AUTH_ERROR_CODES.SESSION_INVALID
      );
    }

    return toAuthUserResponse(user);
  } catch (error) {
    if (isDuplicatePhoneError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.PHONE_IN_USE,
        undefined,
        AUTH_ERROR_CODES.PHONE_CONFLICT
      );
    }

    throw error;
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
      const user = await User.findById(userId).select('+password').session(session);

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
      await revokeAllUserSessionsService(
        userId,
        'password_changed',
        session
      );
    });
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function getActiveSessionsService(
  userId: string,
  currentSessionId?: string
): Promise<{ sessions: SessionResponseDto[] }> {
  const sessions = await Session.find({
    userId,
    revokedAt: undefined,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();

  return {
    sessions: sessions.map((session) => ({
      id: String(session._id),
      ...(session.deviceName ? { deviceName: session.deviceName } : {}),
      ...(session.userAgent ? { userAgent: session.userAgent } : {}),
      ...(session.ip ? { ip: session.ip } : {}),
      roleAtLogin: session.roleAtLogin,
      ...(session.createdAt
        ? { createdAt: session.createdAt.toISOString() }
        : {}),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: String(session._id) === currentSessionId,
    })),
  };
}

//===============================================================

export async function revokeUserSessionService(
  userId: string,
  sessionId: string
): Promise<void> {
  const result = await Session.updateOne(
    { _id: sessionId, userId, revokedAt: undefined },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: 'logout',
        lastUsedAt: new Date(),
      },
    }
  );

  if (result.matchedCount !== 1) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Active session was not found.');
  }
}
