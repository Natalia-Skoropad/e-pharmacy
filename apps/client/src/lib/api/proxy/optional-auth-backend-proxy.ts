import 'server-only';
import { type NextRequest } from 'next/server';

import { createBackendApiUrl } from '@/lib/api/server/backend-api-request';
import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';
import { createProxyTransportErrorResponse } from './proxy-transport-error';

//===================================================================

const OPTIONAL_AUTH_REQUEST_TIMEOUT_MS = 12_000;

//===================================================================

type OptionalAuthBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
};

//===================================================================

function appendSearchParams(path: string, search: string): string {
  return search
    ? `${path}${search.startsWith('?') ? search : `?${search}`}`
    : path;
}

//===================================================================

async function fetchOptionalAuthBackend(
  request: NextRequest,
  backendPath: string,
  forwardCookie: boolean
): Promise<Response> {
  return fetch(createBackendApiUrl(backendPath), {
    method: 'GET',
    headers: createProxyHeaders(request, {
      forwardAccept: true,
      forwardContentType: false,
      forwardCookie,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(OPTIONAL_AUTH_REQUEST_TIMEOUT_MS),
  });
}

//===================================================================

/**
 * Proxies public detail reads that may include user-specific fields, such as
 * `isFavorite`, when auth cookies are present. If stale cookies make the
 * backend reject the request, it retries once without cookies and returns the
 * public detail response instead of forcing a private auth refresh flow.
 */
export async function proxyOptionalAuthBackendRequest({
  backendPath,
  request,
}: OptionalAuthBackendProxyOptions) {
  const pathWithSearch = appendSearchParams(backendPath, request.nextUrl.search);
  let response: Response;

  try {
    response = await fetchOptionalAuthBackend(request, pathWithSearch, true);
  } catch {
    return createProxyTransportErrorResponse({ request });
  }

  if (response.status === 401) {
    try {
      response = await fetchOptionalAuthBackend(request, pathWithSearch, false);
    } catch {
      return createProxyTransportErrorResponse({ request });
    }
  }

  return createProxyResponse(response, {
    cacheControl: 'no-store',
    copySetCookie: false,
  });
}
