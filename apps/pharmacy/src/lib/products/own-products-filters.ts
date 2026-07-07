import type { ProductCategory } from '@e-pharmacy/types';

import type { OwnProductStatus, StockAvailabilityFilter } from './products';

//===================================================================

export type OwnProductsCategoryFilter = 'all' | ProductCategory;
export type OwnProductsStatusFilter = 'all' | OwnProductStatus;
export type OwnProductsStockFilter = 'all' | StockAvailabilityFilter;

//===================================================================

export type OwnProductsFilterState = Readonly<{
  createdDate: {
    from: string;
    to: string;
  };
  name: string;
  article: string;
  category: OwnProductsCategoryFilter;
  status: OwnProductsStatusFilter;
  stock: OwnProductsStockFilter;
}>;

//===================================================================

export const DEFAULT_OWN_PRODUCTS_FILTERS: OwnProductsFilterState = {
  createdDate: {
    from: '',
    to: '',
  },
  name: '',
  article: '',
  category: 'all',
  status: 'all',
  stock: 'all',
};
