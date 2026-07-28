import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import { ApiError } from './api-error';

import {
  parseApiEmptySuccessEnvelope,
  parseApiNullableSuccessEnvelope,
  parseApiSuccessEnvelope,
} from '../response/api-envelope';

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

//===================================================================

export function getNullableResponseData<TData>(
  response: ApiSuccessResponse<TData | null>
): TData | null {
  const envelope = parseApiNullableSuccessEnvelope(response);
  return envelope.data as TData | null;
}

//===================================================================

export function assertSuccessfulEmptyResponse(response: unknown): void {
  parseApiEmptySuccessEnvelope(response);
}
