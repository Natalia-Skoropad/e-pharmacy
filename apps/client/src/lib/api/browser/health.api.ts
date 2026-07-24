import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

type HealthResponse = {
  status: string;
};

//===================================================================

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<HealthResponse>>(
    CLIENT_API_ROUTES.health
  );

  return getResponseData(response);
}
