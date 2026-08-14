import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { AUTH_ERROR_CODES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { logger } from '../utils/logger';

import {
  fingerprintRateLimitKey,
  getProgressiveDelayMs,
  hashRateLimitSecret,
  normalizeRateLimitEmail,
} from './rate-limit-security';

//===============================================================

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_PROGRESSIVE_DELAY_BUCKETS = 10_000;

//===============================================================

type RateLimitKeyResolver = (req: Request, res: Response) => string | null;

type ProgressiveDelayBucket = {
  failures: number;
  resetAt: number;
};

const progressiveDelayBuckets = new Map<string, ProgressiveDelayBucket>();

//===============================================================

function getValidatedBody(res: Response): Record<string, unknown> | null {
  const validated = res.locals.validated as { body?: unknown } | undefined;

  const body = validated?.body;
  return body && typeof body === 'object'
    ? (body as Record<string, unknown>)
    : null;
}

//===============================================================

function getEmailKey(_req: Request, res: Response): string | null {
  const email = normalizeRateLimitEmail(getValidatedBody(res)?.email);
  return email ? `email:${email}` : null;
}

//===============================================================

function getResetTokenKey(_req: Request, res: Response): string | null {
  const tokenHash = hashRateLimitSecret(getValidatedBody(res)?.token);
  return tokenHash ? `reset-token:${tokenHash}` : null;
}

//===============================================================

function getAuthenticatedUserKey(req: Request): string | null {
  const userId = req.user?.id;
  return userId ? `user:${userId}` : null;
}

//===============================================================

function pruneProgressiveDelayBuckets(now: number): void {
  if (progressiveDelayBuckets.size < MAX_PROGRESSIVE_DELAY_BUCKETS) return;

  for (const [key, bucket] of progressiveDelayBuckets) {
    if (bucket.resetAt <= now) progressiveDelayBuckets.delete(key);
  }
}

//===============================================================

function getProgressiveFailureCount(key: string, now: number): number {
  const bucket = progressiveDelayBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    progressiveDelayBuckets.delete(key);
    return 0;
  }

  return bucket.failures;
}

//===============================================================

function recordProgressiveAttempt(
  key: string,
  statusCode: number,
  now: number
): void {
  if (statusCode >= 200 && statusCode < 400) {
    progressiveDelayBuckets.delete(key);
    return;
  }

  if (statusCode < 400 || statusCode >= 500) return;

  const previousFailures = getProgressiveFailureCount(key, now);

  progressiveDelayBuckets.set(key, {
    failures: previousFailures + 1,
    resetAt: now + RATE_LIMIT_WINDOW_MS,
  });

  pruneProgressiveDelayBuckets(now);
}

//===============================================================

function createProgressiveDelay(
  policy: string,
  resolveKey: RateLimitKeyResolver
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = resolveKey(req, res);

    if (!key) {
      next();
      return;
    }

    const now = Date.now();
    const failures = getProgressiveFailureCount(key, now);
    const delayMs = getProgressiveDelayMs(failures);

    res.once('finish', () => {
      recordProgressiveAttempt(key, res.statusCode, Date.now());
    });

    if (delayMs <= 0) {
      next();
      return;
    }

    logger.security({
      action: 'auth_progressive_delay',
      policy,
      delayMs,
      failures,
      accountFingerprint: fingerprintRateLimitKey(key),
      ipFingerprint: fingerprintRateLimitKey(req.ip),
    });

    setTimeout(() => next(), delayMs);
  };
}

//===============================================================

function createRateLimit(options: {
  policy: string;
  limit: number;
  message: string;
  code?: string | null;
  resolveKey?: RateLimitKeyResolver;
  skipSuccessfulRequests?: boolean;
}) {
  const {
    policy,
    limit,
    message,
    code = AUTH_ERROR_CODES.RATE_LIMITED,
    resolveKey,
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(resolveKey
      ? {
          skip: (req, res) => resolveKey(req, res) === null,
          keyGenerator: (req, res) => resolveKey(req, res) ?? 'missing-key',
        }
      : {}),
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    handler: (req, res) => {
      const resolvedKey = resolveKey?.(req, res);

      logger.security({
        action: 'auth_rate_limited',
        policy,
        accountFingerprint: fingerprintRateLimitKey(resolvedKey),
        ipFingerprint: fingerprintRateLimitKey(req.ip),
      });

      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        status: 'error',
        message,
        ...(code ? { code } : {}),
      });
    },
  });
}

//===============================================================

export const registrationDocumentIpRateLimit = createRateLimit({
  policy: 'registration-document-ip',
  limit: 30,
  message: 'Too many document upload attempts. Please try again later.',
});

export const registrationIpRateLimit = createRateLimit({
  policy: 'registration-ip',
  limit: 20,
  message: 'Too many registration attempts. Please try again later.',
});

export const registrationAccountRateLimit = createRateLimit({
  policy: 'registration-account',
  limit: 5,
  message: 'Too many registration attempts. Please try again later.',
  resolveKey: getEmailKey,
});

//===============================================================

export const loginIpRateLimit = createRateLimit({
  policy: 'login-ip',
  limit: 60,
  message: 'Too many login attempts. Please try again later.',
});

export const loginAccountRateLimit = createRateLimit({
  policy: 'login-account',
  limit: 8,
  message: 'Too many login attempts. Please try again later.',
  resolveKey: getEmailKey,
  skipSuccessfulRequests: true,
});

export const loginProgressiveDelay = createProgressiveDelay(
  'login-account',
  getEmailKey
);

//===============================================================

export const passwordResetRequestIpRateLimit = createRateLimit({
  policy: 'password-reset-request-ip',
  limit: 30,
  message: 'Too many password reset requests. Please try again later.',
});

export const passwordResetAccountRateLimit = createRateLimit({
  policy: 'password-reset-request-account',
  limit: 5,
  message: 'Too many password reset requests. Please try again later.',
  resolveKey: getEmailKey,
});

export const passwordResetConfirmIpRateLimit = createRateLimit({
  policy: 'password-reset-confirm-ip',
  limit: 30,
  message: 'Too many password reset attempts. Please try again later.',
});

export const passwordResetTokenRateLimit = createRateLimit({
  policy: 'password-reset-confirm-token',
  limit: 5,
  message: 'Too many password reset attempts. Please try again later.',
  resolveKey: getResetTokenKey,
});

//===============================================================

export const passwordChangeIpRateLimit = createRateLimit({
  policy: 'password-change-ip',
  limit: 60,
  message: 'Too many password change attempts. Please try again later.',
});

export const passwordChangeAccountRateLimit = createRateLimit({
  policy: 'password-change-account',
  limit: 5,
  message: 'Too many password change attempts. Please try again later.',
  resolveKey: (req) => getAuthenticatedUserKey(req),
  skipSuccessfulRequests: true,
});

export const passwordChangeProgressiveDelay = createProgressiveDelay(
  'password-change-account',
  (req) => getAuthenticatedUserKey(req)
);

//===============================================================

export const reviewRateLimit = createRateLimit({
  policy: 'review-ip',
  limit: 10,
  message: 'Too many review submissions. Please try again later.',
  code: null,
});
