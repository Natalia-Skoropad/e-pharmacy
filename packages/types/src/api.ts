export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data?: TData;
};

export type ApiErrorResponse = {
  status?: 'error' | 'fail';
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  meta: PaginationMeta;
};

export type ApiPaginationResponse<TItem> = {
  items: TItem[];
} & PaginationMeta;
