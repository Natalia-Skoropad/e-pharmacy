export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data: TData;
};

export type ApiEmptySuccessResponse = {
  status: 'success';
  message?: string;
};
