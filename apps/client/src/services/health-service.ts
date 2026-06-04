import { getResponseData, localApiRequest } from '@/lib/api';
import { clientApiRoutes as CLIENT_API_ROUTES } from '@e-pharmacy/api-client';

import type { ApiSuccessResponse } from '@/types';

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
