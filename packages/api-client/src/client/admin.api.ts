import { apiRequest, getResponseData } from '../core';
import { apiRoutes as API_ROUTES } from '../routes';

import type {
  ApiSuccessResponse,
  CreatePharmacyByAdminPayload,
  PharmacyProfileResponse,
  UpdatePharmacyStatusPayload,
} from '@e-pharmacy/types';

//===================================================================

export async function createPharmacyByAdmin(
  payload: CreatePharmacyByAdminPayload
): Promise<PharmacyProfileResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<PharmacyProfileResponse>
  >(API_ROUTES.admin.pharmacies, { method: 'POST', body: payload });

  return getResponseData(response);
}

//===================================================================

export async function updatePharmacyStatusByAdmin(
  pharmacyId: string,
  payload: UpdatePharmacyStatusPayload
): Promise<PharmacyProfileResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<PharmacyProfileResponse>
  >(API_ROUTES.admin.updatePharmacyStatus(pharmacyId), {
    method: 'PATCH',
    body: payload,
  });

  return getResponseData(response);
}
