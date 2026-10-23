// S10.4: Canonical Auth sessions domain.
import type { ClientSession } from 'mongoose';

import { AUTH_ERROR_CODES, USER_STATUSES } from '../../constants/auth';
import { API_MESSAGES } from '../../constants/messages';
import { HTTP_STATUS } from '../../constants/httpStatus';

import { Session } from '../../models/accounts/session.model';
import { User } from '../../models/accounts/user.model';

import type { AuthSessionResult, AuthTokens } from '../../types/auth';

import type {
  SessionContext,
  SessionResponseDto,
  SessionRevokedReason,
} from '../../types/session';

import { httpError } from '../../utils/httpError';
import { signToken } from '../../utils/jwt';
import { toAuthUserResponse } from '../../utils/userResponse';

import {
  REFRESH_TOKEN_ROTATION_GRACE_MS,
  ACCESS_TOKEN_TTL_SECONDS,
  createRefreshToken,
  deriveRotatedRefreshToken,
  getSignedRefreshTokenSessionId,
  hashRefreshToken,
  getSessionAbsoluteExpiresAt,
  getRefreshTokenExpiresAt,
  getRefreshTokenExpiresInSeconds,
  sanitizeSessionContext,
} from './auth-session-tokens';

import type { UserDocument } from './auth-user-fields';

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

export async function buildAuthSessionResult(
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

export async function getActiveSessionsService(
  userId: string,
  currentSessionId?: string
): Promise<{ sessions: SessionResponseDto[] }> {
  const now = new Date();

  const sessions = await Session.find({ userId })
    .sort({ createdAt: -1 })
    .limit(200)
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

      ...(session.revokedAt
        ? { revokedAt: session.revokedAt.toISOString() }
        : {}),

      ...(session.revokedReason
        ? { revokedReason: session.revokedReason }
        : {}),

      isCurrent:
        !session.revokedAt &&
        session.expiresAt > now &&
        (!session.absoluteExpiresAt || session.absoluteExpiresAt > now) &&
        String(session._id) === currentSessionId,
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
