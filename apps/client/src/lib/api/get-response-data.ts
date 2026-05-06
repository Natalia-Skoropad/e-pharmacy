import type { ApiSuccessResponse } from '@/types';

import { ApiError } from './api-error';

//===================================================================

export function getResponseData<TData>(
  response: ApiSuccessResponse<TData>
): TData {
  if (!response.data) {
    throw new ApiError('API response data is missing', 500, response);
  }

  return response.data;
}
