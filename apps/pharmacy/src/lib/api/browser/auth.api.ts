import 'client-only';

import { getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
} from '@e-pharmacy/types/api';

import type { AuthResponse } from '@e-pharmacy/types/auth';
import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

export async function getCurrentUser(options?: {
  signal?: AbortSignal;
}): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.auth.current,
    { signal: options?.signal }
  );

  return parseAuthResponse(getResponseData(response));
}

//===================================================================

export async function logoutUser(options?: {
  signal?: AbortSignal;
}): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    PHARMACY_API_ROUTES.auth.logout,
    {
      method: 'POST',
      signal: options?.signal,
    }
  );
}
