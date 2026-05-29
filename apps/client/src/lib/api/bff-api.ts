import { apiRequest } from './api-request';
import { localApiRequest } from './local-api';

import type { ApiRequestConfig } from './types';

//===================================================================

export async function bffApiRequest<TData>(
  backendPath: string,
  clientPath: string,
  config?: ApiRequestConfig
): Promise<TData> {
  if (typeof window === 'undefined') {
    return apiRequest<TData>(backendPath, config);
  }

  return localApiRequest<TData>(clientPath, config);
}
