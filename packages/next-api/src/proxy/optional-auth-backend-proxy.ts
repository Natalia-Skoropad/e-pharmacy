import type { NextRequest } from 'next/server';

import {
  responseInvalidatesAuthSession,
  responseRequiresAuthRefresh,
} from '../internal/auth-error-code';

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

import {
  createAllowedAuthCookieHeader,
  createPrivateCookieHeaderWithAccessToken,
} from '../internal/cookie-header';

import { createProxyResponse } from '../internal/proxy-response';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import { NEXT_API_TIMEOUTS_MS } from '../internal/transport-policy';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export type OptionalAuthPolicy = 'public-fallback' | 'refresh-aware' | 'strict';

//===================================================================

type OptionalAuthBackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  policy: OptionalAuthPolicy;
}>;

//===================================================================

type RefreshAwareExecution = Readonly<{
  response: Response;
  tokensToSet?: Awaited<ReturnType<typeof refreshAuthSession>>['tokens'];
  shouldClearAuthCookies: boolean;
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

async function executeRefreshAwareRead({
  backendPath,
  request,
  requestId,
  refreshToken,
}: {
  backendPath: string;
  request: NextRequest;
  requestId: string;
  refreshToken: string;
}): Promise<RefreshAwareExecution> {
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
      return {
        response: await executePublicFallback(backendPath, request, requestId),
        shouldClearAuthCookies:
          refreshResult.invalidTokenResponse ||
          (await responseInvalidatesAuthSession(refreshResult.response)),
      };
    }

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
      (await responseRequiresAuthRefresh(retryResponse)) ||
      (await responseInvalidatesAuthSession(retryResponse))
    ) {
      return {
        response: await executePublicFallback(backendPath, request, requestId),
        shouldClearAuthCookies: true,
      };
    }

    return {
      response: retryResponse,
      tokensToSet: refreshResult.tokens,
      shouldClearAuthCookies: false,
    };
  } catch (error) {
    const descriptor = describeProxyError(error);

    // A malformed successful refresh response is an invalid session contract
    // and must not keep stale auth cookies alive. Temporary network/backend
    // outages preserve cookies and fall back to anonymous public data.
    return {
      response: await executePublicFallback(backendPath, request, requestId),
      shouldClearAuthCookies: descriptor.code === 'INVALID_BACKEND_RESPONSE',
    };
  }
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
    const refreshToken = getRequestRefreshToken(request);
    const hasAccessCandidate = Boolean(
      createAllowedAuthCookieHeader(
        request.headers.get('cookie'),
        'access-only'
      )
    );

    // A refresh-aware optional request must recover a valid session even when
    // the short-lived access cookie has already disappeared. Without this
    // pre-refresh, the backend correctly sees an anonymous request and has no
    // reason to return 401.
    if (policy === 'refresh-aware' && !hasAccessCandidate && refreshToken) {
      refreshPerformed = true;
      const refreshed = await executeRefreshAwareRead({
        backendPath,
        request,
        requestId,
        refreshToken,
      });

      response = refreshed.response;
      shouldClearAuthCookies = refreshed.shouldClearAuthCookies;
      tokensToSet = refreshed.tokensToSet;
    } else {
      response = await executeOptionalRead({
        backendPath,
        request,
        requestId,
        authCookieMode: 'access-only',
      });

      if (response.status === 401 && policy === 'public-fallback') {
        response = await executePublicFallback(backendPath, request, requestId);
      } else if (policy === 'refresh-aware') {
        const requiresRefresh = await responseRequiresAuthRefresh(response);
        const invalidatesSession =
          await responseInvalidatesAuthSession(response);

        if (requiresRefresh) {
          if (!refreshToken) {
            shouldClearAuthCookies = true;
            response = await executePublicFallback(
              backendPath,
              request,
              requestId
            );
          } else {
            refreshPerformed = true;
            const refreshed = await executeRefreshAwareRead({
              backendPath,
              request,
              requestId,
              refreshToken,
            });

            response = refreshed.response;
            shouldClearAuthCookies = refreshed.shouldClearAuthCookies;
            tokensToSet = refreshed.tokensToSet;
          }
        } else if (invalidatesSession) {
          shouldClearAuthCookies = true;
          response = await executePublicFallback(
            backendPath,
            request,
            requestId
          );
        } else if (response.status === 401) {
          // Optional endpoints remain readable anonymously, but an unrelated
          // 401 must never become an instruction to refresh/replay the request.
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
