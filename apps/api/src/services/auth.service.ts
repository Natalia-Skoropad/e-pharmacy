import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

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
import { buildPasswordResetUrl } from '../utils/password-reset-url';
import { sendPasswordResetEmail } from '../utils/passwordResetEmail';
import { toAuthUserResponse } from '../utils/userResponse';
import { claimRegistrationPharmacyDocuments } from './pharmacy-document.service';

import {
  enforcePasswordResetResponseTiming,
  startPasswordResetResponseTiming,
} from './auth-response-timing';

//===============================================================

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_VERSION = 'rt1';
const REFRESH_TOKEN_ROTATION_GRACE_MS = 10_000;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

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

const SESSION_ABSOLUTE_TTL_MS = parseDurationMs(
  String(env.SESSION_ABSOLUTE_EXPIRES_IN),
  90 * 24 * 60 * 60 * 1000
);

//===============================================================

function signRefreshTokenValue(sessionId: string, secret: string): string {
  const payload = `${REFRESH_TOKEN_VERSION}.${sessionId}.${secret}`;
  const signature = createHmac('sha256', env.JWT_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

//===============================================================

function createRefreshToken(sessionId: string): string {
  return signRefreshTokenValue(
    sessionId,
    randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
  );
}

//===============================================================

function deriveRotatedRefreshToken(
  previousToken: string,
  sessionId: string
): string {
  const secret = createHmac('sha512', env.JWT_SECRET)
    .update(`refresh-rotation:${sessionId}:${previousToken}`)
    .digest('hex');

  return signRefreshTokenValue(sessionId, secret);
}

//===============================================================

function getSignedRefreshTokenSessionId(token: string): string | null {
  const [version, sessionId, secret, signature, ...rest] = token.split('.');

  if (
    rest.length > 0 ||
    version !== REFRESH_TOKEN_VERSION ||
    !sessionId ||
    !OBJECT_ID_PATTERN.test(sessionId) ||
    !secret ||
    !/^[a-f\d]+$/i.test(secret) ||
    !signature ||
    !/^[a-f\d]{64}$/i.test(signature)
  ) {
    return null;
  }

  const expected = createHmac('sha256', env.JWT_SECRET)
    .update(`${version}.${sessionId}.${secret}`)
    .digest();
  const received = Buffer.from(signature, 'hex');

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  return sessionId;
}

//===============================================================

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

//===============================================================

function getSessionAbsoluteExpiresAt(nowMs = Date.now()): Date {
  return new Date(nowMs + SESSION_ABSOLUTE_TTL_MS);
}

//===============================================================

function getRefreshTokenExpiresAt(
  absoluteExpiresAt: Date,
  nowMs = Date.now()
): Date {
  return new Date(
    Math.min(nowMs + REFRESH_TOKEN_TTL_MS, absoluteExpiresAt.getTime())
  );
}

//===============================================================

function getRefreshTokenExpiresInSeconds(expiresAt: Date): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
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
  const safeContext = sanitizeSessionContext(context);
  const absoluteExpiresAt = getSessionAbsoluteExpiresAt();
  const expiresAt = getRefreshTokenExpiresAt(absoluteExpiresAt);

  const session = new Session({
    userId: user._id,
    roleAtLogin: user.role,
    expiresAt,
    absoluteExpiresAt,
    lastUsedAt: new Date(),
    ...safeContext,
  });

  const refreshToken = createRefreshToken(String(session._id));
  session.refreshTokenHash = hashRefreshToken(refreshToken);
  await session.save();

  const accessToken = signToken({
    userId: String(user._id),
    role: user.role,
    sessionId: String(session._id),
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: getRefreshTokenExpiresInSeconds(expiresAt),
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

//===============================================================

export async function refreshAuthSessionService(
  refreshToken: string,
  context?: SessionContext,
  siblingRefreshTokens: readonly string[] = []
): Promise<AuthSessionResult> {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const signedSessionId = getSignedRefreshTokenSessionId(refreshToken);
  const now = new Date();
  const sessionSelect =
    '+refreshTokenHash +previousRefreshTokenHash revokedAt revokedReason expiresAt absoluteExpiresAt previousRefreshTokenValidUntil userId';

  let session = await Session.findOne({ refreshTokenHash }).select(
    sessionSelect
  );

  if (!session) {
    session = await Session.findOne({
      previousRefreshTokenHash: refreshTokenHash,
    }).select(sessionSelect);
  }

  // New-format refresh tokens are signed and contain their session id. This
  // lets the backend recognize an older token from the same family even after
  // it is no longer the single previous-token slot, without trusting an
  // attacker-controlled session id.
  if (!session && signedSessionId) {
    session = await Session.findById(signedSessionId).select(sessionSelect);
  }

  if (!session) {
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

  const absoluteExpiresAt = session.absoluteExpiresAt ?? session.expiresAt;

  if (session.expiresAt <= now || absoluteExpiresAt <= now) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  const matchesCurrentToken = session.refreshTokenHash === refreshTokenHash;
  const matchesPreviousToken =
    session.previousRefreshTokenHash === refreshTokenHash;

  if (
    matchesPreviousToken &&
    (!session.previousRefreshTokenValidUntil ||
      session.previousRefreshTokenValidUntil <= now)
  ) {
    const siblingHashes = new Set(
      siblingRefreshTokens
        .filter((candidate) => candidate && candidate !== refreshToken)
        .map(hashRefreshToken)
    );

    // Duplicate cookie candidates are a compatibility surface during path/domain
    // migrations. If the same request also carries the current token for this
    // session, fail this stale predecessor without revoking the valid device
    // session; the controller will continue with the remaining candidates.
    if (siblingHashes.has(session.refreshTokenHash)) {
      throw httpError(
        HTTP_STATUS.UNAUTHORIZED,
        API_MESSAGES.INVALID_TOKEN,
        undefined,
        AUTH_ERROR_CODES.SESSION_INVALID
      );
    }

    await Session.updateOne(
      { _id: session._id, revokedAt: undefined },
      {
        $set: {
          revokedAt: now,
          revokedReason: 'token_reuse',
          lastUsedAt: now,
        },
      }
    );

    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_REVOKED
    );
  }

  if (!matchesCurrentToken && !matchesPreviousToken) {
    // A valid-but-older family token can legitimately arrive as a duplicate
    // stale cookie after a path/domain migration. It must never authenticate,
    // but it also must not revoke the valid current cookie before the
    // controller gets a chance to try the remaining cookie candidates. Reuse
    // revocation is reserved for the immediate predecessor after its grace
    // window, where the backend can prove the token was recently rotated.
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  const user = await User.findById(session.userId);

  if (!user) {
    await Session.updateOne(
      { _id: session._id, revokedAt: undefined },
      { $set: { revokedAt: now, lastUsedAt: now } }
    );

    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.USER_NOT_FOUND,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  if (user.status === USER_STATUSES.BLOCKED) {
    await Session.updateOne(
      { _id: session._id, revokedAt: undefined },
      {
        $set: {
          revokedAt: now,
          revokedReason: 'user_blocked',
          lastUsedAt: now,
        },
      }
    );

    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.USER_BLOCKED,
      undefined,
      AUTH_ERROR_CODES.USER_BLOCKED
    );
  }

  const safeContext = sanitizeSessionContext(context);
  const sessionContextUpdate = {
    lastUsedAt: now,
    ...(safeContext.userAgent ? { userAgent: safeContext.userAgent } : {}),
    ...(safeContext.ip ? { ip: safeContext.ip } : {}),
    ...(safeContext.deviceName ? { deviceName: safeContext.deviceName } : {}),
  };

  const rotatedRefreshToken = deriveRotatedRefreshToken(
    refreshToken,
    String(session._id)
  );
  let effectiveSession = session;

  if (matchesCurrentToken) {
    const nextExpiresAt = getRefreshTokenExpiresAt(
      absoluteExpiresAt,
      now.getTime()
    );
    const previousRefreshTokenValidUntil = new Date(
      Math.min(
        now.getTime() + REFRESH_TOKEN_ROTATION_GRACE_MS,
        nextExpiresAt.getTime(),
        absoluteExpiresAt.getTime()
      )
    );

    const rotated = await Session.findOneAndUpdate(
      {
        _id: session._id,
        refreshTokenHash,
        revokedAt: undefined,
        expiresAt: { $gt: now },
        $or: [
          { absoluteExpiresAt: { $gt: now } },
          { absoluteExpiresAt: { $exists: false } },
        ],
      },
      {
        $set: {
          refreshTokenHash: hashRefreshToken(rotatedRefreshToken),
          previousRefreshTokenHash: refreshTokenHash,
          previousRefreshTokenValidUntil,
          expiresAt: nextExpiresAt,
          absoluteExpiresAt,
          ...sessionContextUpdate,
        },
      },
      { new: true }
    ).select(sessionSelect);

    if (rotated) {
      effectiveSession = rotated;
    } else {
      // Another request rotated the same token first. Re-read the one-token
      // grace state and return the exact same deterministic successor token.
      const raced = await Session.findOne({
        _id: session._id,
        previousRefreshTokenHash: refreshTokenHash,
        previousRefreshTokenValidUntil: { $gt: new Date() },
        revokedAt: undefined,
      }).select(sessionSelect);

      if (!raced) {
        throw httpError(
          HTTP_STATUS.UNAUTHORIZED,
          API_MESSAGES.INVALID_TOKEN,
          undefined,
          AUTH_ERROR_CODES.SESSION_INVALID
        );
      }

      effectiveSession = raced;
    }
  } else {
    // Grace retry of the previous token must not rotate again or extend the
    // session. Because the successor is derived from the previous raw token,
    // every parallel request receives the same current refresh token without
    // storing raw refresh secrets in Mongo.
    if (
      hashRefreshToken(rotatedRefreshToken) !==
      effectiveSession.refreshTokenHash
    ) {
      await Session.updateOne(
        { _id: effectiveSession._id, revokedAt: undefined },
        {
          $set: {
            revokedAt: new Date(),
            revokedReason: 'token_reuse',
          },
        }
      );

      throw httpError(
        HTTP_STATUS.UNAUTHORIZED,
        API_MESSAGES.INVALID_TOKEN,
        undefined,
        AUTH_ERROR_CODES.SESSION_REVOKED
      );
    }

    await Session.updateOne(
      { _id: effectiveSession._id, revokedAt: undefined },
      { $set: sessionContextUpdate }
    );
  }

  const accessToken = signToken({
    userId: String(user._id),
    role: user.role,
    sessionId: String(effectiveSession._id),
  });

  return {
    user: toAuthUserResponse(user),
    tokens: {
      accessToken,
      refreshToken: rotatedRefreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresIn: getRefreshTokenExpiresInSeconds(
        effectiveSession.expiresAt
      ),
    },
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

export async function revokeAllUserSessionsByRefreshTokensService(
  refreshTokens: readonly string[]
): Promise<void> {
  const refreshTokenHashes = Array.from(
    new Set(refreshTokens.filter(Boolean).map(hashRefreshToken))
  );

  if (refreshTokenHashes.length === 0) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  const now = new Date();
  const activeSession = await Session.findOne({
    revokedAt: undefined,
    expiresAt: { $gt: now },
    $and: [
      {
        $or: [
          { refreshTokenHash: { $in: refreshTokenHashes } },
          { previousRefreshTokenHash: { $in: refreshTokenHashes } },
        ],
      },
      {
        $or: [
          { absoluteExpiresAt: { $gt: now } },
          { absoluteExpiresAt: { $exists: false } },
        ],
      },
    ],
  }).select('userId');

  if (!activeSession) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.INVALID_TOKEN,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  await revokeAllUserSessionsService(String(activeSession.userId));
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
    .select('revokedAt expiresAt absoluteExpiresAt')
    .lean();

  const now = new Date();
  if (
    !session ||
    session.expiresAt <= now ||
    (session.absoluteExpiresAt !== undefined &&
      session.absoluteExpiresAt <= now)
  ) {
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
    pharmacy: env.PHARMACY_APP_URL || env.CLIENT_APP_URL,
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

function createPasswordResetUrl(
  token: string,
  application: ForgotPasswordInput['application']
): string {
  return buildPasswordResetUrl(getPasswordResetAppUrl(application), token);
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

  if ('address' in input) {
    if (typeof input.address === 'string') update.address = input.address;
    else if (input.address === null) unset.address = '';
  }

  if ('pictureUrl' in input) {
    if (input.pictureUrl) update.pictureUrl = input.pictureUrl;
    else unset.pictureUrl = '';
  }

  const updateQuery: Record<string, unknown> = {};

  if (Object.keys(update).length > 0) updateQuery.$set = update;
  if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

  const expectedRevision = new Date(input.expectedRevision);

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, updatedAt: expectedRevision },
      updateQuery,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!user) {
      const userExists = await User.exists({ _id: userId });

      if (userExists) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Profile changed in another session. Reload the latest data and try again.',
          undefined,
          AUTH_ERROR_CODES.PROFILE_CONFLICT
        );
      }

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

//===============================================================

export async function getActiveSessionsService(
  userId: string,
  currentSessionId?: string
): Promise<{ sessions: SessionResponseDto[] }> {
  const now = new Date();
  const sessions = await Session.find({
    userId,
    revokedAt: undefined,
    expiresAt: { $gt: now },
    $or: [
      { absoluteExpiresAt: { $gt: now } },
      { absoluteExpiresAt: { $exists: false } },
    ],
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
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Active session was not found.',
      undefined,
      AUTH_ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }
}
