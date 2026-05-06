import { apiRequest, getResponseData } from '@/lib/api';

import type { ApiSuccessResponse } from '@/types';

//===================================================================

type HealthResponse = {
  status: string;
};

//===================================================================

export async function getApiHealth(): Promise<HealthResponse> {
  const response =
    await apiRequest<ApiSuccessResponse<HealthResponse>>('/health');

  return getResponseData(response);
}
