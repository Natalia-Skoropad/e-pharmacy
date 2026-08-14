import type { NextFunction, Request, Response } from 'express';

import { AUTH_ERROR_CODES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  decrementRateLimitCounter,
  getRateLimitCounter,
  incrementRateLimitCounter,
  incrementRateLimitCounterInWindow,
  resetRateLimitCounter,
} from '../services/rate-limit-store.service';

import { logger } from '../utils/logger';

import {
  fingerprintRateLimitKey,
  getProgressiveDelayMs,
  hashRateLimitSecret,
  normalizeRateLimitEmail,
} from './rate-limit-security';

//===============================================================

type RateLimitKeyResolver = (req: Request, res: Response) => string | null;

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

function getIpKey(req: Request): string | null {
  return req.ip ? `ip:${req.ip}` : null;
}

//===============================================================

function getEmailIpKey(req: Request, res: Response): string | null {
  const emailKey = getEmailKey(req, res);
  const ipKey = getIpKey(req);

  return emailKey && ipKey ? `${emailKey}|${ipKey}` : null;
}

//===============================================================

function runAfterResponse(res: Response, operation: () => Promise<void>): void {
  res.once('finish', () => {
    void operation().catch((error) => {
      logger.error('[security] Failed to update distributed rate-limit state', {
        error,
      });
    });
  });
}

//===============================================================

function createProgressiveDelay(
  policy: string,
  resolveKey: RateLimitKeyResolver
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const key = resolveKey(req, res);

    if (!key) {
      next();
      return;
    }

    try {
      const counter = await getRateLimitCounter(`progressive:${policy}`, key);
      const failures = counter.hits;
      const delayMs = getProgressiveDelayMs(failures);

      runAfterResponse(res, async () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          await resetRateLimitCounter(counter.window);
          return;
        }

        if (res.statusCode >= 400 && res.statusCode < 500) {
          await incrementRateLimitCounterInWindow(counter.window);
        }
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
    } catch (error) {
      next(error);
    }
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

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const key = resolveKey ? resolveKey(req, res) : getIpKey(req);

    if (!key) {
      next();
      return;
    }

    try {
      const counter = await incrementRateLimitCounter(policy, key);
      const remaining = Math.max(0, limit - counter.hits);
      const resetSeconds = Math.max(
        1,
        Math.ceil((counter.window.resetAt.getTime() - Date.now()) / 1000)
      );

      res.setHeader('RateLimit-Limit', String(limit));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(resetSeconds));

      if (skipSuccessfulRequests) {
        runAfterResponse(res, async () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            await decrementRateLimitCounter(counter.window);
          }
        });
      }

      if (counter.hits <= limit) {
        next();
        return;
      }

      res.setHeader('Retry-After', String(resetSeconds));

      logger.security({
        action: 'auth_rate_limited',
        policy,
        accountFingerprint: fingerprintRateLimitKey(
          resolveKey ? key : undefined
        ),
        ipFingerprint: fingerprintRateLimitKey(req.ip),
      });

      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        status: 'error',
        message,
        ...(code ? { code } : {}),
      });
    } catch (error) {
      next(error);
    }
  };
}

//===============================================================

export const registrationDocumentSessionIpRateLimit = createRateLimit({
  policy: 'registration-document-session-ip',
  limit: 5,
  message: 'Too many document upload sessions. Please try again later.',
});

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

export const loginAccountIpRateLimit = createRateLimit({
  policy: 'login-account-ip',
  limit: 8,
  message: 'Too many login attempts from this network. Please try again later.',
  resolveKey: getEmailIpKey,
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
