import { type NextRequest } from 'next/server';

import { createApiUrl } from './api-url';
import { createProxyHeaders, getProxyBody } from './proxy-headers';
import { createProxyResponse } from './proxy-response';
import type { HttpMethod } from './types';

//===================================================================

type BackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: HttpMethod;
};

//===================================================================

/**
 * Proxies private same-origin `/api/*` requests to the backend API.
 * It forwards cookies so httpOnly auth can work without exposing tokens
 * to browser JavaScript.
 */
export async function proxyBackendRequest({
  backendPath,
  request,
  method = 'GET',
}: BackendProxyOptions) {
  const response = await fetch(createApiUrl(backendPath), {
    method,
    headers: createProxyHeaders(request),
    body: await getProxyBody(request, method),
    cache: 'no-store',
    credentials: 'include',
  });

  return createProxyResponse(response, {
    cacheControl: 'no-store',
  });
}
