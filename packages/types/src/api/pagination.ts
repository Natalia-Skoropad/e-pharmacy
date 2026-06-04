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
