import type { ApiErrorResponse } from './api-error';

//===================================================================

export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data: TData;
};

export type ApiEmptySuccessResponse = Omit<ApiSuccessResponse<never>, 'data'>;

export type ApiResponse<TData = unknown> =
  | ApiSuccessResponse<TData>
  | ApiEmptySuccessResponse
  | ApiErrorResponse;
