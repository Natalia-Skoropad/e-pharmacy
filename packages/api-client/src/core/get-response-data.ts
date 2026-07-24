import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import { ApiError } from './api-error';

//===================================================================

export function getResponseData<TData>(
  response: ApiSuccessResponse<TData>
): TData {
  if (response.data === undefined || response.data === null) {
    throw new ApiError('API response data is missing', 500, response, {
      code: 'INVALID_RESPONSE',
    });
  }

  return response.data;
}

//===================================================================

export function getNullableResponseData<TData>(
  response: ApiSuccessResponse<TData | null>
): TData | null {
  return response.data ?? null;
}

//===================================================================

export function assertSuccessfulEmptyResponse(
  response: Pick<ApiSuccessResponse<unknown>, 'status'>
): void {
  if (response.status !== 'success') {
    throw new ApiError('API response is not successful', 500, response, {
      code: 'INVALID_RESPONSE',
    });
  }
}
