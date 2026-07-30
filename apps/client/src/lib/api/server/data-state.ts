import 'server-only';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { isAbortError } from '@e-pharmacy/utils/guards';

import type {
  DataUnavailableReason,
  ResolvedDataState,
  ServerDataErrorContext,
} from '../resource-state';

export type {
  DataUnavailableReason,
  ResolvedDataState,
  ServerDataErrorContext,
} from '../resource-state';

//===================================================================

export type ServerDataState<TData> = ResolvedDataState<TData>;

//===================================================================

export function getDataUnavailableReason(
  error: unknown
): DataUnavailableReason {
  if (!isApiError(error)) return 'server_error';

  if (error.transportCode === 'TIMEOUT' || error.httpStatus === 408) {
    return 'timeout';
  }

  if (error.transportCode === 'NETWORK_ERROR') return 'network';
  if (error.transportCode === 'INVALID_RESPONSE') return 'invalid_response';
  if (error.httpStatus === 401) return 'unauthorized';
  if (error.httpStatus === 403) return 'forbidden';
  if (error.httpStatus === 429) return 'rate_limit';

  if ([502, 503, 504].includes(error.httpStatus ?? 0)) {
    return 'service_unavailable';
  }

  return 'server_error';
}

//===================================================================

export function getServerDataErrorContext(
  error: unknown
): ServerDataErrorContext {
  return {
    reason: getDataUnavailableReason(error),

    ...(isApiError(error) && error.requestId
      ? { requestId: error.requestId }
      : {}),

    ...(isApiError(error) && error.httpStatus !== undefined
      ? { httpStatus: error.httpStatus }
      : {}),

    ...(isApiError(error) && error.backendCode
      ? { backendCode: error.backendCode }
      : {}),
  };
}

//===================================================================

export async function resolveServerDataState<TData>(
  request: Promise<TData>
): Promise<ServerDataState<TData>> {
  try {
    return { status: 'success', data: await request };
  } catch (error) {
    if (isAbortError(error)) throw error;

    return {
      status: 'unavailable',
      ...getServerDataErrorContext(error),
    };
  }
}
