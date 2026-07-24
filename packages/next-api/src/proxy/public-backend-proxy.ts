import 'server-only';
import type { NextRequest } from 'next/server';

import { wait } from '@e-pharmacy/api-client/core';

import { executeBackendFetch } from '../internal/backend-fetch';
import { validateBackendJsonResponse } from '../internal/backend-response';
import { createProxyResponse } from '../internal/proxy-response';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import {
  DEFAULT_PUBLIC_REVALIDATE_SECONDS,
  DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
  NEXT_API_TIMEOUTS_MS,
  PUBLIC_READ_RETRY_POLICY,
} from '../internal/transport-policy';

import { logTransportRequest } from '../observability/logger';

//===================================================================

type PublicBackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  revalidate?: number | false;
}>;

//===================================================================

function validateRevalidate(value: number | false | undefined): number | false {
  if (value === false) return false;
  const resolved = value ?? DEFAULT_PUBLIC_REVALIDATE_SECONDS;

  if (!Number.isInteger(resolved) || resolved < 0 || resolved > 86_400) {
    throw new RangeError(
      'Public revalidate must be an integer from 0 to 86400.'
    );
  }

  return resolved;
}

//===================================================================

function createCacheControl(revalidate: number | false): string {
  if (revalidate === false || revalidate === 0) return 'no-store';

  return `public, s-maxage=${revalidate}, stale-while-revalidate=${DEFAULT_STALE_WHILE_REVALIDATE_SECONDS}`;
}

//===================================================================

export async function proxyPublicBackendRequest({
  backendPath,
  request,
  requestId,
  revalidate,
}: PublicBackendProxyOptions) {
  const startedAt = Date.now();
  const resolvedRevalidate = validateRevalidate(revalidate);
  let response: Response | undefined;
  let lastError: unknown;
  let retryCount = 0;

  for (
    let attempt = 1;
    attempt <= PUBLIC_READ_RETRY_POLICY.attempts;
    attempt += 1
  ) {
    try {
      response = await executeBackendFetch({
        request,
        backendPath,
        method: 'GET',
        requestId,
        timeoutMs: NEXT_API_TIMEOUTS_MS.publicRead,
        authCookieMode: 'none',
        forwardAccept: true,
      });
      await validateBackendJsonResponse(response);

      if (
        attempt < PUBLIC_READ_RETRY_POLICY.attempts &&
        PUBLIC_READ_RETRY_POLICY.statuses.includes(
          response.status as (typeof PUBLIC_READ_RETRY_POLICY.statuses)[number]
        )
      ) {
        retryCount += 1;
        await wait(PUBLIC_READ_RETRY_POLICY.delayMs);
        continue;
      }

      break;
    } catch (error) {
      response = undefined;
      lastError = error;

      if (attempt < PUBLIC_READ_RETRY_POLICY.attempts) {
        retryCount += 1;
        await wait(PUBLIC_READ_RETRY_POLICY.delayMs);
        continue;
      }
    }
  }

  if (!response) {
    const descriptor = describeProxyError(lastError);

    logTransportRequest({
      requestId,
      method: 'GET',
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: descriptor.status,
      retryCount,
      authMode: 'public',
      transportErrorCode: descriptor.code,
      source: 'public-proxy',
    });

    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  const cacheControl = response.ok
    ? createCacheControl(resolvedRevalidate)
    : 'no-store';

  logTransportRequest({
    requestId,
    method: 'GET',
    path: backendPath,
    destination: 'backend',
    durationMs: Date.now() - startedAt,
    status: response.status,
    retryCount,
    authMode: 'public',
    cachePolicy: cacheControl,
    source: 'public-proxy',
  });

  return createProxyResponse(response, { cacheControl, requestId });
}
