type PaginationMeta = Readonly<{
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}>;

export type ApiPaginationResponse<TItem> = Readonly<{
  items: readonly TItem[];
}> &
  PaginationMeta;
