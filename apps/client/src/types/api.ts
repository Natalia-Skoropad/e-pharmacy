export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data?: TData;
};

//===================================================================

export type ApiErrorResponse = {
  status?: 'error' | 'fail';
  message?: string | string[];
  error?: string;
};
