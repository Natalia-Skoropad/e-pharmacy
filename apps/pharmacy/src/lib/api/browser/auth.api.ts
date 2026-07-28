import 'client-only';

import {
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';
import type { AuthResponse } from '@e-pharmacy/types/auth';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

export async function getCurrentUser(options?: {
  signal?: AbortSignal;
}): Promise<AuthResponse> {
  const path = PHARMACY_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAuthResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function logoutUser(options?: {
  signal?: AbortSignal;
}): Promise<void> {
  const path = PHARMACY_API_ROUTES.auth.logout;
  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}
