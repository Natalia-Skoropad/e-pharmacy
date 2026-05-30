import { type NextRequest } from 'next/server';

import { appendSearchParams } from '@e-pharmacy/api-client';

import { createApiUrl } from './api-url';
import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';

//===================================================================

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 300;
const STALE_WHILE_REVALIDATE_SECONDS = 600;

//===================================================================

type PublicBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  revalidate?: number;
};

//===================================================================

//===================================================================

function createPublicCacheControl(revalidate: number): string {
  return `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
}

//===================================================================

/**
 * Proxies public same-origin `/api/*` GET requests to the backend API.
 * Query params are forwarded, and cache headers are added for CDN/server reuse.
 */
export async function proxyPublicBackendRequest({
  backendPath,
  request,
  revalidate = DEFAULT_PUBLIC_REVALIDATE_SECONDS,
}: PublicBackendProxyOptions) {
  const pathWithSearch = appendSearchParams(backendPath, request.nextUrl.search);

  const response = await fetch(createApiUrl(pathWithSearch), {
    method: 'GET',
    headers: createProxyHeaders(request, {
      forwardAccept: true,
      forwardContentType: false,
      forwardCookie: false,
    }),
    cache: 'force-cache',
    next: { revalidate },
  });

  return createProxyResponse(response, {
    cacheControl: createPublicCacheControl(revalidate),
    copySetCookie: false,
  });
}
