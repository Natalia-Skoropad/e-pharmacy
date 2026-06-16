export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type ApiPaginationResponse<TItem> = {
  items: TItem[];
} & PaginationMeta;
