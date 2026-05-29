import { cookies } from 'next/headers';

import { apiRequest } from './api-request';
import type { ApiRequestConfig } from './types';

//===================================================================

export async function serverApiRequest<TData>(
  path: string,
  config?: ApiRequestConfig
): Promise<TData> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const headers = new Headers(config?.headers);

  if (cookieHeader && !headers.has('Cookie')) {
    headers.set('Cookie', cookieHeader);
  }

  return apiRequest<TData>(path, {
    ...config,
    headers,
    cache: config?.cache ?? 'no-store',
    credentials: config?.credentials ?? 'include',
  });
}
