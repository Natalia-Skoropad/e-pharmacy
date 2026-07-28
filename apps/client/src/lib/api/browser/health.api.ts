import 'client-only';

import {
  parseApiResponseData,
  parseHealthResponse,
  type HealthResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

export async function getApiHealth(): Promise<HealthResponse> {
  const path = CLIENT_API_ROUTES.health;

  return parseApiResponseData(
    await localApiRequest(path),
    parseHealthResponse,
    { url: path, method: 'GET' }
  );
}
