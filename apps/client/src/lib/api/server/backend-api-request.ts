import 'server-only';

import {
  ApiError,
  apiRequest,
  createApiUrl,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { logApiRequest } from '@/lib/api/observability/request-logger';

//===================================================================

const LOCAL_API_BASE_URL = 'http://localhost:4000';

//===================================================================

export function getBackendApiBaseUrl(): string {
  const configuredBaseUrl = process.env.API_BASE_URL;

  if (configuredBaseUrl?.trim()) return configuredBaseUrl;
  if (process.env.NODE_ENV !== 'production') return LOCAL_API_BASE_URL;

  throw new Error('API_BASE_URL is not configured for server requests.');
}

//===================================================================

export function createBackendApiUrl(path: string): string {
  return createApiUrl(path, getBackendApiBaseUrl());
}

//===================================================================

export async function backendApiRequest<TData>(
  path: string,
  { method = 'GET', cache, ...options }: RequestOptions = {}
): Promise<TData> {
  const startedAt = Date.now();

  try {
    const data = await apiRequest<TData>(path, {
      ...options,
      method,
      cache,
      baseUrl: getBackendApiBaseUrl(),
    });

    logApiRequest({
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      cache,
      source: 'server-api',
    });

    return data;
  } catch (error) {
    logApiRequest({
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: error instanceof ApiError ? error.status : undefined,
      cache,
      source: 'server-api',
    });

    throw error;
  }
}
