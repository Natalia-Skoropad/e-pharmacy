import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import { ApiError } from './api-error';
import { parseApiSuccessEnvelope } from '../response/api-envelope';

//===================================================================

export function getResponseData<TData>(
  response: ApiSuccessResponse<TData>
): TData {
  const envelope = parseApiSuccessEnvelope(response);

  if (envelope.data === undefined || envelope.data === null) {
    throw new ApiError('API response data is missing.', {
      transportCode: 'INVALID_RESPONSE',
      payload: response,
    });
  }

  return envelope.data as TData;
}
