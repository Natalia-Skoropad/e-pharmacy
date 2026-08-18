import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { REQUEST_ID_HEADER_NAME } from '../constants/bff';
import { logger } from '../utils/logger';

//===============================================================

const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i;

//===============================================================

function formatTraceIdAsRequestId(traceId: string): string {
  return [
    traceId.slice(0, 8),
    traceId.slice(8, 12),
    traceId.slice(12, 16),
    traceId.slice(16, 20),
    traceId.slice(20),
  ].join('-');
}

//===============================================================

function getRequestId(req: Request): string {
  const value = req.get(REQUEST_ID_HEADER_NAME)?.trim();
  if (value && SAFE_REQUEST_ID_PATTERN.test(value)) return value;

  const traceparent = req.get('traceparent')?.trim();
  const traceMatch = traceparent?.match(TRACEPARENT_PATTERN);
  if (traceMatch && !/^0{32}$/.test(traceMatch[1])) {
    return formatTraceIdAsRequestId(traceMatch[1].toLowerCase());
  }

  return randomUUID();
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
