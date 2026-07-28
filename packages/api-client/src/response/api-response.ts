import { ApiError, isApiError } from '../transport/api-error';

import {
  parseApiEmptySuccessEnvelope,
  parseApiSuccessEnvelope,
  type ApiResponseContext,
} from './api-envelope';

//===================================================================

export type ApiDataParser<TData> = (
  value: unknown,
  context?: ApiResponseContext
) => TData;

//===================================================================

export function parseApiResponseData<TData>(
  response: unknown,
  parser: ApiDataParser<TData>,
  context: ApiResponseContext = {}
): TData {
  const envelope = parseApiSuccessEnvelope(response, context);

  try {
    return parser(envelope.data, context);
  } catch (error) {
    if (isApiError(error)) throw error;

    throw new ApiError('API endpoint response does not match its contract.', {
      transportCode: 'INVALID_RESPONSE',
      payload: envelope.data,
      cause: error,
      ...context,
    });
  }
}

//===================================================================

export function parseApiEmptyResponse(
  response: unknown,
  context: ApiResponseContext = {}
): void {
  parseApiEmptySuccessEnvelope(response, context);
}
