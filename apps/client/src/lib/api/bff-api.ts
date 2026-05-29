import { localApiRequest } from './local-api';
import type { ApiRequestConfig } from './types';

//===================================================================

/**
 * Uses direct backend requests on the server and same-origin `/api/*` requests
 * in the browser. This keeps server-side caching intact and avoids browser CORS
 * or cookie issues for client-side interactions.
 */
export async function bffApiRequest<TData>(
  backendPath: string,
  clientPath: string,
  config?: ApiRequestConfig
): Promise<TData> {
  if (typeof window === 'undefined') {
    const { serverApiRequest } = await import('./server-api');

    return serverApiRequest<TData>(backendPath, config);
  }

  return localApiRequest<TData>(clientPath, config);
}
