import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { REQUEST_ID_HEADER_NAME } from '../constants/bff';
import { logger } from '../utils/logger';

//===============================================================

const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

//===============================================================

function getRequestId(req: Request): string {
  const value = req.get(REQUEST_ID_HEADER_NAME)?.trim();
  return value && SAFE_REQUEST_ID_PATTERN.test(value) ? value : randomUUID();
}

//===============================================================

export function attachRequestContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = getRequestId(req);
  const startedAt = Date.now();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    logger.request({
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
