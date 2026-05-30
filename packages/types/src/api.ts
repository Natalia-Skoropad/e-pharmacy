export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data: TData;
};

export type ApiErrorResponse = {
  status: 'error';
  message: string;
  details?: Record<string, string[]>;
};

export type ApiEmptySuccessResponse = Omit<ApiSuccessResponse<never>, 'data'>;

export type ApiResponse<TData = unknown> =
  | ApiSuccessResponse<TData>
  | ApiEmptySuccessResponse
  | ApiErrorResponse;

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
