import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AUTH_ERROR_CODES } from '../constants/auth';

import {
  BFF_AUTH_PROXY_HEADER_NAME,
  BFF_AUTH_PROXY_MARKER_VALUE,
  BFF_PROXY_SECRET_HEADER_NAME,
} from '../constants/bff';

import { HTTP_STATUS } from '../constants/httpStatus';
import { httpError } from '../utils/httpError';

//===============================================================

export function isNextAuthProxyRequest(req: Request): boolean {
  const marker = req.headers[BFF_AUTH_PROXY_HEADER_NAME];
  const secret = req.headers[BFF_PROXY_SECRET_HEADER_NAME];
  const configuredSecret = env.BFF_PROXY_SECRET.trim();

  if (marker !== BFF_AUTH_PROXY_MARKER_VALUE) return false;

  return typeof secret === 'string' && secret === configuredSecret;
}

//===============================================================

export function requireTrustedAuthProxy(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (isNextAuthProxyRequest(req)) {
    next();
    return;
  }

  next(
    httpError(
      HTTP_STATUS.FORBIDDEN,
      'Authentication session endpoints are available only through the trusted BFF.',
      undefined,
      AUTH_ERROR_CODES.FORBIDDEN_ORIGIN
    )
  );
}
