import 'server-only';
import { type NextRequest } from 'next/server';

import { createBackendApiUrl } from '@/lib/api/server/backend-api-request';
import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';

//===================================================================

const OPTIONAL_AUTH_REQUEST_TIMEOUT_MS = 12_000;

//===================================================================

type OptionalAuthBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
};

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
  let response = await fetchOptionalAuthBackend(request, backendPath, true);

  if (response.status === 401) {
    response = await fetchOptionalAuthBackend(request, backendPath, false);
  }

  return createProxyResponse(response, {
    cacheControl: 'no-store',
    copySetCookie: false,
  });
}
