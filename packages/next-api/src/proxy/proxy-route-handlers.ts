import 'server-only';

import { type NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/core';

import { proxyAuthRequest, type AuthMarkerAction } from './auth-proxy';
import { proxyBackendRequest } from './backend-proxy';
import { proxyOptionalAuthBackendRequest } from './optional-auth-backend-proxy';
import { proxyPublicBackendRequest } from './public-backend-proxy';

//===================================================================

type RouteParams = Record<string, string>;

type RouteContext<TParams extends RouteParams> = {
  params: Promise<TParams>;
};

type BackendPath<TParams extends RouteParams> =
  | string
  | ((params: TParams) => string);

type ProxyRouteHandler<TParams extends RouteParams> = (
  request: NextRequest,
  context: RouteContext<TParams>
) => Promise<Response>;

//===================================================================

async function resolveBackendPath<TParams extends RouteParams>(
  backendPath: BackendPath<TParams>,
  context: RouteContext<TParams>
): Promise<string> {
  if (typeof backendPath === 'string') return backendPath;

  return backendPath(await context.params);
}

//===================================================================

export function createPrivateProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  method = 'GET',
  clearAuthCookiesOnSuccess = false,
  clearAuthCookiesOnRefreshFailure = false,
}: {
  backendPath: BackendPath<TParams>;
  method?: HttpMethod;
  clearAuthCookiesOnSuccess?: boolean;
  clearAuthCookiesOnRefreshFailure?: boolean;
}): ProxyRouteHandler<TParams> {
  return async (request, context) =>
    proxyBackendRequest({
      request,
      backendPath: await resolveBackendPath(backendPath, context),
      method,
      clearAuthCookiesOnSuccess,
      clearAuthCookiesOnRefreshFailure,
    });
}

//===================================================================

export function createPublicGetProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  revalidate,
}: {
  backendPath: BackendPath<TParams>;
  revalidate?: number;
}): ProxyRouteHandler<TParams> {
  return async (request, context) =>
    proxyPublicBackendRequest({
      request,
      backendPath: await resolveBackendPath(backendPath, context),
      revalidate,
    });
}

//===================================================================

export function createOptionalAuthGetProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
}: {
  backendPath: BackendPath<TParams>;
}): ProxyRouteHandler<TParams> {
  return async (request, context) =>
    proxyOptionalAuthBackendRequest({
      request,
      backendPath: await resolveBackendPath(backendPath, context),
    });
}

//===================================================================

export function createPublicGetPrivatePostProxyRoute<
  TParams extends RouteParams = RouteParams,
>({
  backendPath,
  revalidate,
}: {
  backendPath: BackendPath<TParams>;
  revalidate?: number;
}): {
  GET: ProxyRouteHandler<TParams>;
  POST: ProxyRouteHandler<TParams>;
} {
  return {
    GET: createPublicGetProxyRoute({ backendPath, revalidate }),
    POST: createPrivateProxyRoute({ backendPath, method: 'POST' }),
  };
}

//===================================================================

export function createAuthProxyRoute({
  backendPath,
  method = 'POST',
  markerAction,
}: {
  backendPath: string;
  method?: Extract<HttpMethod, 'GET' | 'POST' | 'PATCH'>;
  markerAction?: AuthMarkerAction;
}) {
  return async (request: NextRequest) =>
    proxyAuthRequest({
      request,
      backendPath,
      method,
      markerAction,
    });
}
