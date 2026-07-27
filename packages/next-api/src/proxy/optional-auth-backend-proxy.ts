import type { NextRequest } from 'next/server';

import { responseInvalidatesAuthSession } from '../internal/auth-error-code';

import {
  clearClientAuthCookies,
  setClientAuthCookies,
} from '../internal/auth-cookies';

import {
  getRequestRefreshToken,
  refreshAuthSession,
} from '../internal/auth-refresh';

import { executeBackendFetch } from '../internal/backend-fetch';
import { validateBackendJsonResponse } from '../internal/backend-response';
import { createPrivateCookieHeaderWithAccessToken } from '../internal/cookie-header';
import { createProxyResponse } from '../internal/proxy-response';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import { NEXT_API_TIMEOUTS_MS } from '../internal/transport-policy';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export type OptionalAuthPolicy =
  | 'public-fallback'
  | 'refresh-aware'
  | 'strict';

//===================================================================

type OptionalAuthBackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  policy: OptionalAuthPolicy;
}>;

//===================================================================

async function executeOptionalRead({
  backendPath,
  request,
  requestId,
  authCookieMode,
  cookieHeaderOverride,
}: {
  backendPath: string;
  request: NextRequest;
  requestId: string;
  authCookieMode: 'access-only' | 'none';
  cookieHeaderOverride?: string;
}): Promise<Response> {
  const response = await executeBackendFetch({
    request,
    backendPath,
    method: 'GET',
    requestId,
    timeoutMs: NEXT_API_TIMEOUTS_MS.privateRequest,
    authCookieMode,
    cookieHeaderOverride,
    forwardAccept: true,
  });

  await validateBackendJsonResponse(response);
  return response;
}

//===================================================================

async function executePublicFallback(
  backendPath: string,
  request: NextRequest,
  requestId: string
): Promise<Response> {
  return executeOptionalRead({
    backendPath,
    request,
    requestId,
    authCookieMode: 'none',
  });
}

//===================================================================

export async function proxyOptionalAuthBackendRequest({
  backendPath,
  request,
  requestId,
  policy,
}: OptionalAuthBackendProxyOptions) {
  const startedAt = Date.now();
  let response: Response;
  let refreshPerformed = false;
  let shouldClearAuthCookies = false;
  let tokensToSet:
    | Awaited<ReturnType<typeof refreshAuthSession>>['tokens']
    | undefined;

  try {
    response = await executeOptionalRead({
      backendPath,
      request,
      requestId,
      authCookieMode: 'access-only',
    });

    if (response.status === 401 && policy === 'public-fallback') {
      response = await executePublicFallback(backendPath, request, requestId);
    } else if (response.status === 401 && policy === 'refresh-aware') {
      const refreshToken = getRequestRefreshToken(request);

      if (!refreshToken) {
        shouldClearAuthCookies = true;
        response = await executePublicFallback(backendPath, request, requestId);
      } else {
        refreshPerformed = true;

        try {
          const refreshResult = await refreshAuthSession(
            request,
            requestId,
            refreshToken
          );

          if (
            !refreshResult.response.ok ||
            refreshResult.invalidTokenResponse ||
            !refreshResult.tokens
          ) {
            shouldClearAuthCookies =
              refreshResult.invalidTokenResponse ||
              (await responseInvalidatesAuthSession(refreshResult.response));

            response = await executePublicFallback(
              backendPath,
              request,
              requestId
            );
          } else {
            const retryCookieHeader = createPrivateCookieHeaderWithAccessToken(
              request.headers.get('cookie'),
              refreshResult.tokens.accessToken
            );

            const retryResponse = await executeOptionalRead({
              backendPath,
              request,
              requestId,
              authCookieMode: 'none',
              cookieHeaderOverride: retryCookieHeader,
            });

            if (
              retryResponse.status === 401 ||
              retryResponse.status === 403
            ) {
              shouldClearAuthCookies =
                await responseInvalidatesAuthSession(retryResponse);
              response = await executePublicFallback(
                backendPath,
                request,
                requestId
              );
            } else {
              tokensToSet = refreshResult.tokens;
              response = retryResponse;
            }
          }
        } catch (error) {
          const descriptor = describeProxyError(error);

          // A malformed successful refresh response is an invalid session
          // contract and must not keep stale auth cookies alive. Temporary
          // network/backend outages still preserve cookies and fall back to
          // public data.
          shouldClearAuthCookies =
            descriptor.code === 'INVALID_BACKEND_RESPONSE';

          response = await executePublicFallback(
            backendPath,
            request,
            requestId
          );
        }
      }
    }
  } catch (error) {
    const descriptor = describeProxyError(error);

    logTransportRequest({
      requestId,
      method: 'GET',
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: descriptor.status,
      authMode: 'optional',
      refreshPerformed,
      transportErrorCode: descriptor.code,
      source: 'optional-auth-proxy',
    });

    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  const nextResponse = createProxyResponse(response, {
    cacheControl: 'no-store',
    requestId,
  });

  if (shouldClearAuthCookies) {
    clearClientAuthCookies(nextResponse, request);
  } else if (tokensToSet) {
    setClientAuthCookies(nextResponse, request, tokensToSet);
  }

  logTransportRequest({
    requestId,
    method: 'GET',
    path: backendPath,
    destination: 'backend',
    durationMs: Date.now() - startedAt,
    status: response.status,
    authMode: 'optional',
    refreshPerformed,
    source: 'optional-auth-proxy',
  });

  return nextResponse;
}
