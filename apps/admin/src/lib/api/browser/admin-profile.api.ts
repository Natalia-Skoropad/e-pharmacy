import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type { AuthResponse } from '@e-pharmacy/types/auth';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

//===================================================================

export type UpdateMyAdminEmployeeProfilePayload = Readonly<{
  pictureUrl?: string | null;
  expectedRevision: ISODateTimeString;
}>;

//===================================================================

export async function updateMyAdminEmployeeProfile(
  payload: UpdateMyAdminEmployeeProfilePayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AuthResponse> {
  const path = ADMIN_API_ROUTES.adminEmployees.myProfile;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'PATCH',
      body: payload,
      signal: options?.signal,
    }),

    parseAuthResponse,
    { url: path, method: 'PATCH' }
  );
}
