import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AUTH_ERROR_CODES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import { httpError } from '../utils/httpError';

//===============================================================

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

//===============================================================

function toOrigin(value?: string): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

//===============================================================

function getRequestOrigin(req: Request): string | null {
  return toOrigin(req.get('origin')) || toOrigin(req.get('referer'));
}

//===============================================================

function getAllowedOrigins(): Set<string> {
  const origins = [env.CLIENT_APP_URL, ...env.CLIENT_ORIGINS]
    .map(toOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return new Set(origins);
}

//===============================================================

export function validateMutationOrigin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const requestOrigin = getRequestOrigin(req);
  const allowedOrigins = getAllowedOrigins();

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    next();
    return;
  }

  next(
    httpError(
      HTTP_STATUS.FORBIDDEN,
      API_MESSAGES.FORBIDDEN_ORIGIN,
      undefined,
      AUTH_ERROR_CODES.FORBIDDEN_ORIGIN
    )
  );
}
