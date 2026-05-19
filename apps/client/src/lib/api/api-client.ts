import { AUTH_SESSION_READY_TOKEN } from '@/lib/auth';
import { CLIENT_ENV } from '@/lib/constants/env';

import { ApiError } from './api-error';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import type { ApiRequestConfig } from './types';

//===================================================================

function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, CLIENT_ENV.apiBaseUrl).toString();
}

//===================================================================

export async function apiRequest<TData>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    cache = 'no-store',
    next,
    authToken,
  }: ApiRequestConfig = {}
): Promise<TData> {
  const response = await fetch(createApiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && authToken !== AUTH_SESSION_READY_TOKEN
        ? { Authorization: `Bearer ${authToken}` }
        : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
    next,
    credentials: 'include',
  });

  const payload = await parseJsonSafe<TData>(response);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload
    );
  }

  return payload as TData;
}
