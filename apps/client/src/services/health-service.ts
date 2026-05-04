import { apiRequest } from '@/lib/api';

//===================================================================

type HealthResponse = {
  status: string;
};

//===================================================================

export function getApiHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}
