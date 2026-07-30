export type DataUnavailableReason =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'service_unavailable'
  | 'invalid_response'
  | 'unauthorized'
  | 'forbidden'
  | 'server_error';

//===================================================================

export type ServerDataErrorContext = Readonly<{
  reason: DataUnavailableReason;
  requestId?: string;
  httpStatus?: number;
  backendCode?: string;
}>;

//===================================================================

export type ResolvedDataState<TData> =
  | Readonly<{ status: 'success'; data: TData }>
  | (Readonly<{ status: 'unavailable' }> & ServerDataErrorContext);

export type ResourceState =
  | Readonly<{ status: 'available' }>
  | (Readonly<{ status: 'unavailable' }> & ServerDataErrorContext);

//===================================================================

export function toResourceState<TData>(
  state: ResolvedDataState<TData>
): ResourceState {
  return state.status === 'success'
    ? { status: 'available' }
    : {
        status: 'unavailable',
        reason: state.reason,
        ...(state.requestId ? { requestId: state.requestId } : {}),
        ...(state.httpStatus !== undefined
          ? { httpStatus: state.httpStatus }
          : {}),
        ...(state.backendCode ? { backendCode: state.backendCode } : {}),
      };
}

//===================================================================

export function isResourceUnavailable(
  state: ResourceState
): state is Readonly<{ status: 'unavailable' }> & ServerDataErrorContext {
  return state.status === 'unavailable';
}
