import { ApiError, apiRequest } from '@/lib/api';

import type { ApiSuccessResponse } from '@/types';

//===================================================================

type HealthResponse = {
  status: string;
};

//===================================================================

export async function getApiHealth(): Promise<HealthResponse> {
  const response =
    await apiRequest<ApiSuccessResponse<HealthResponse>>('/health');

  if (!response.data) {
    throw new ApiError('Health response data is missing', 500, response);
  }

  return response.data;
}
