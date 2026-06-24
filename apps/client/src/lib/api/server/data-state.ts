import 'server-only';

import { ApiError } from '@e-pharmacy/api-client/core';

//===================================================================

export type DataUnavailableReason = 'timeout' | 'server_error' | 'network';

export type ServerDataState<TData> =
  | { status: 'success'; data: TData }
  | { status: 'unavailable'; reason: DataUnavailableReason };

//===================================================================

export function getDataUnavailableReason(error: unknown): DataUnavailableReason {
  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT' || error.status === 408) return 'timeout';
    if (error.code === 'NETWORK_ERROR' || error.status === 0) return 'network';
  }

  return 'server_error';
}

//===================================================================

export async function resolveServerDataState<TData>(
  request: Promise<TData>
): Promise<ServerDataState<TData>> {
  try {
    return { status: 'success', data: await request };
  } catch (error) {
    return {
      status: 'unavailable',
      reason: getDataUnavailableReason(error),
    };
  }
}
