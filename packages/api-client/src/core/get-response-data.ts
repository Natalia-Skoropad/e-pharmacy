import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { ApiError } from './api-error';

//===================================================================

export function getResponseData<TData>(
  response: ApiSuccessResponse<TData>
): TData {
  if (response.data === undefined || response.data === null) {
    throw new ApiError('API response data is missing', 500, response);
  }

  return response.data;
}
