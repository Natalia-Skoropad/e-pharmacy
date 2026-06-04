import { type NextRequest } from 'next/server';

import { appendSearchParams } from '../bff';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/auth';

import { createApiUrl } from '../core/api-url';
import { proxyBackendRequest } from './backend-proxy';
import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';

//===================================================================

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 300;
const STALE_WHILE_REVALIDATE_SECONDS = 600;

const AUTH_RELATED_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
];

//===================================================================

type PublicBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  revalidate?: number;
};

//===================================================================

function createPublicCacheControl(revalidate: number): string {
  return `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
}

//===================================================================

function hasAuthContext(request: NextRequest): boolean {
  return AUTH_RELATED_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

//===================================================================

/**
 * Proxies public same-origin `/api/*` GET requests to the backend API.
 *
 * Guest requests stay cacheable for fast catalog/pharmacy pages.
 * Authenticated requests are intentionally proxied as private no-store requests,
 * because product/store payloads can contain viewer-specific fields such as
 * `isFavorite`. Without cookies, the UI can show a successful favorite toast
 * while the profile page still receives public items with `isFavorite: false`.
 */
export async function proxyPublicBackendRequest({
  backendPath,
  request,
  revalidate = DEFAULT_PUBLIC_REVALIDATE_SECONDS,
}: PublicBackendProxyOptions) {
  const pathWithSearch = appendSearchParams(
    backendPath,
    request.nextUrl.search
  );

  if (hasAuthContext(request)) {
    return proxyBackendRequest({
      request,
      backendPath: pathWithSearch,
      method: 'GET',
    });
  }

  const response = await fetch(createApiUrl(pathWithSearch), {
    method: 'GET',
    headers: createProxyHeaders(request, {
      forwardAccept: true,
      forwardContentType: false,
      forwardCookie: false,
    }),
    cache: 'force-cache',
    next: { revalidate },
  } as RequestInit & { next?: { revalidate?: number } });

  return createProxyResponse(response, {
    cacheControl: createPublicCacheControl(revalidate),
    copySetCookie: false,
  });
}
