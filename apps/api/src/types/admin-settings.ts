import type {
  ProductCategoryKind,
  ProductCategoryStatus,
} from '../constants/product-category';

//===============================================================

export type ProductCategoryUsageDto = Readonly<{
  productsCount: number;
  productRequestsCount: number;
  total: number;
}>;

export type PositionUsageDto = Readonly<{
  employeesCount: number;
  total: number;
}>;

//===============================================================

export type AdminProductCategoryDto = Readonly<{
  id: string;
  name: string;
  slug: string;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  color: string;
  usage: ProductCategoryUsageDto;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminPositionDto = Readonly<{
  id: string;
  name: string;
  usage: PositionUsageDto;
  createdAt: string;
  updatedAt: string;
}>;

//===============================================================

export type AdminProductCategoriesListDto = Readonly<{
  items: readonly AdminProductCategoryDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  earliestCreatedAt: string | null;
}>;

export type AdminPositionsListDto = Readonly<{
  items: readonly AdminPositionDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  earliestCreatedAt: string | null;
}>;
