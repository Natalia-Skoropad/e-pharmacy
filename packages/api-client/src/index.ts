export type ApiErrorResponse = {
  message: string;
  statusCode?: number;
};

//===================================================================

export type ApiSuccessResponse<TData> = {
  data: TData;
};

//===================================================================

export const API_HEADERS = {
  json: {
    'Content-Type': 'application/json',
  },
} as const;
