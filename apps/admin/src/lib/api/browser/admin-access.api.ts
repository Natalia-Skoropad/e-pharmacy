import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parseAdminAccessResponse,
  type AdminAccessResponse,
} from '@/lib/permissions/admin-access';

//===================================================================

export async function getCurrentAdminAccess(options?: {
  signal?: AbortSignal;
}): Promise<AdminAccessResponse> {
  const path = ADMIN_API_ROUTES.adminAccess.current;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminAccessResponse,
    { url: path, method: 'GET' }
  );
}
