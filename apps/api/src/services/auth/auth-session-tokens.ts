// S10.4: Canonical Auth session-tokens domain.
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { env } from '../../config/env';

import type { SessionContext } from '../../types/session';

import { parseDurationMs } from '../../utils/duration';

//===============================================================

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_VERSION = 'rt1';
export const REFRESH_TOKEN_ROTATION_GRACE_MS = 10_000;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

//===============================================================

export const ACCESS_TOKEN_TTL_SECONDS = Math.max(
  1,
  Math.floor(parseDurationMs(String(env.JWT_EXPIRES_IN), 15 * 60 * 1000) / 1000)
);

//===============================================================

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

export function createRefreshToken(sessionId: string): string {
  return signRefreshTokenValue(
    sessionId,
    randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
  );
}

//===============================================================

export function deriveRotatedRefreshToken(
  previousToken: string,
  sessionId: string
): string {
  const secret = createHmac('sha512', env.JWT_SECRET)
    .update(`refresh-rotation:${sessionId}:${previousToken}`)
    .digest('hex');

  return signRefreshTokenValue(sessionId, secret);
}

//===============================================================

export function getSignedRefreshTokenSessionId(token: string): string | null {
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

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

//===============================================================

export function getSessionAbsoluteExpiresAt(nowMs = Date.now()): Date {
  return new Date(nowMs + SESSION_ABSOLUTE_TTL_MS);
}

//===============================================================

export function getRefreshTokenExpiresAt(
  absoluteExpiresAt: Date,
  nowMs = Date.now()
): Date {
  return new Date(
    Math.min(nowMs + REFRESH_TOKEN_TTL_MS, absoluteExpiresAt.getTime())
  );
}

//===============================================================

export function getRefreshTokenExpiresInSeconds(expiresAt: Date): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
}

//===============================================================

export function sanitizeSessionContext(
  context?: SessionContext
): SessionContext {
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
