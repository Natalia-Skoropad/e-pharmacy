import { localApiRequest } from './local-api-request';
import { getResponseData } from '@e-pharmacy/api-client/core';
import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

import type { ApiSuccessResponse } from '@e-pharmacy/types';

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
