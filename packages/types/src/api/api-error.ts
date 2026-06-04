export type ApiErrorResponse = {
  status: 'error';
  message: string;
  details?: Record<string, string[]>;
};

export type ApiError = ApiErrorResponse;
