import 'server-only';
import { type NextRequest } from 'next/server';
import { createApiUrl } from '@e-pharmacy/api-client/core';
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

function appendSearchParams(path: string, search: string): string {
  return search
    ? `${path}${search.startsWith('?') ? search : `?${search}`}`
    : path;
}

//===================================================================

export async function proxyPublicBackendRequest({
  backendPath,
  request,
  revalidate = DEFAULT_PUBLIC_REVALIDATE_SECONDS,
}: PublicBackendProxyOptions) {
  const pathWithSearch = appendSearchParams(
    backendPath,
    request.nextUrl.search
  );

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
    cacheControl: `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
    copySetCookie: false,
  });
}
