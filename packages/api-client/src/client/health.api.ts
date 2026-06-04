import { getResponseData, localApiRequest } from '../core';
import { clientApiRoutes as CLIENT_API_ROUTES } from '../routes';

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
