import type { NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/transport';

import type { AuthCookieForwardMode } from '../internal/cookie-header';
import { validateBffMutationRequest } from '../internal/csrf';
import type { ProxyRequestBodyPreset } from '../internal/request-body';
import { createRequestId } from '../internal/request-id';

import {
  parseEntityIdSegment,
  parseEnumRouteSegment,
} from '../internal/route-params';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import {
  proxyAuthRequest,
  type AuthCookieCleanupPolicy,
  type AuthMarkerAction,
} from './auth-proxy';

import { proxyBackendRequest } from './backend-proxy';

import {
  proxyOptionalAuthBackendRequest,
  type OptionalAuthPolicy,
} from './optional-auth-backend-proxy';

import { proxyPublicBackendRequest } from './public-backend-proxy';

//===================================================================

type RouteParams = Record<string, string>;
type RawRouteParams<TParams extends RouteParams> = {
  [TKey in keyof TParams]: string;
};

type EnumParamValues<TParams extends RouteParams> = Partial<
  Record<keyof TParams, readonly string[]>
>;

type RouteContext<TParams extends RouteParams> = {
  params: Promise<RawRouteParams<TParams>>;
};

type BackendPath<TParams extends RouteParams> =
  | string
  | ((params: TParams) => string);

type ProxyRouteHandler<TParams extends RouteParams> = (
  request: NextRequest,
  context: RouteContext<TParams>
) => Promise<Response>;

//===================================================================

function parseRouteParams<TParams extends RouteParams>(
  params: RawRouteParams<TParams>,
  enumParams: EnumParamValues<TParams> = {}
): TParams {
  const parsed = Object.fromEntries(
    Object.entries(params).map(([name, value]) => {
      const allowedValues = enumParams[name as keyof TParams];

      return [
        name,
        allowedValues
          ? parseEnumRouteSegment(value, allowedValues, name)
          : parseEntityIdSegment(value, name),
      ];
    })
  );

  return parsed as TParams;
}

//===================================================================

async function resolveBackendPath<TParams extends RouteParams>(
  backendPath: BackendPath<TParams>,
  context: RouteContext<TParams>,
  enumParams?: EnumParamValues<TParams>
): Promise<string> {
  if (typeof backendPath === 'string') return backendPath;

  const params = parseRouteParams(await context.params, enumParams);
  return backendPath(params);
}

//===================================================================

async function handleRouteFactoryError(
  error: unknown,
  request: NextRequest,
  requestId: string
): Promise<Response> {
  return createProxyErrorResponse({
    descriptor: describeProxyError(error),
    requestId,
    request,
  });
}

//===================================================================

export function createPrivateProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  method = 'GET',
  clearAuthCookiesOnSuccess = false,
  bodyPreset = 'standardJson',
  enumParams,
}: {
  backendPath: BackendPath<TParams>;
  method?: HttpMethod;
  clearAuthCookiesOnSuccess?: boolean;
  bodyPreset?: ProxyRequestBodyPreset;
  enumParams?: EnumParamValues<TParams>;
}): ProxyRouteHandler<TParams> {
  return async (request, context) => {
    const requestId = createRequestId();

    try {
      validateBffMutationRequest(request, method);

      return proxyBackendRequest({
        request,
        requestId,
        backendPath: await resolveBackendPath(backendPath, context, enumParams),
        method,
        clearAuthCookiesOnSuccess,
        bodyPreset,
      });
    } catch (error) {
      return handleRouteFactoryError(error, request, requestId);
    }
  };
}

//===================================================================

export function createPublicGetProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  revalidate,
  staleWhileRevalidate,
  enumParams,
}: {
  backendPath: BackendPath<TParams>;
  revalidate?: number | false;
  staleWhileRevalidate?: number;
  enumParams?: EnumParamValues<TParams>;
}): ProxyRouteHandler<TParams> {
  return async (request, context) => {
    const requestId = createRequestId();

    try {
      return proxyPublicBackendRequest({
        request,
        requestId,
        backendPath: await resolveBackendPath(backendPath, context, enumParams),
        revalidate,
        staleWhileRevalidate,
      });
    } catch (error) {
      return handleRouteFactoryError(error, request, requestId);
    }
  };
}

//===================================================================

export function createOptionalAuthGetProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  policy = 'public-fallback',
  enumParams,
}: {
  backendPath: BackendPath<TParams>;
  policy?: OptionalAuthPolicy;
  enumParams?: EnumParamValues<TParams>;
}): ProxyRouteHandler<TParams> {
  return async (request, context) => {
    const requestId = createRequestId();

    try {
      return proxyOptionalAuthBackendRequest({
        request,
        requestId,
        backendPath: await resolveBackendPath(backendPath, context, enumParams),
        policy,
      });
    } catch (error) {
      return handleRouteFactoryError(error, request, requestId);
    }
  };
}

//===================================================================

export function createPublicGetPrivatePostProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  revalidate,
  staleWhileRevalidate,
  enumParams,
}: {
  backendPath: BackendPath<TParams>;
  revalidate?: number | false;
  staleWhileRevalidate?: number;
  enumParams?: EnumParamValues<TParams>;
}): {
  GET: ProxyRouteHandler<TParams>;
  POST: ProxyRouteHandler<TParams>;
} {
  return {
    GET: createPublicGetProxyRoute({
      backendPath,
      revalidate,
      staleWhileRevalidate,
      enumParams,
    }),

    POST: createPrivateProxyRoute({
      backendPath,
      method: 'POST',
      enumParams,
    }),
  };
}

//===================================================================

export function createAuthProxyRoute({
  backendPath,
  method = 'POST',
  markerAction,
  cookieCleanup = 'none',
  authCookieMode = 'none',
  bodyPreset = 'smallJson',
}: {
  backendPath: string;
  method?: Extract<HttpMethod, 'GET' | 'POST' | 'PATCH'>;
  markerAction?: AuthMarkerAction;
  cookieCleanup?: AuthCookieCleanupPolicy;
  authCookieMode?: AuthCookieForwardMode;
  bodyPreset?: ProxyRequestBodyPreset;
}) {
  return async (request: NextRequest) => {
    const requestId = createRequestId();

    try {
      validateBffMutationRequest(request, method);

      return proxyAuthRequest({
        request,
        requestId,
        backendPath,
        method,
        markerAction,
        cookieCleanup,
        authCookieMode,
        bodyPreset,
      });
    } catch (error) {
      return handleRouteFactoryError(error, request, requestId);
    }
  };
}
