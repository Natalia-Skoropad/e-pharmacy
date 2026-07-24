import type { ProductCategory } from '@e-pharmacy/types/products';

import type { OwnProductStatus } from './products';

//===================================================================

export type AllProductsAddedToMyPharmacyFilter = 'all' | 'yes' | 'no';
export type AllProductsCategoryFilter = 'all' | ProductCategory;
export type AllProductsStatusFilter = 'all' | OwnProductStatus;

//===================================================================

export type AllProductsFilterState = Readonly<{
  createdDate: {
    from: string;
    to: string;
  };
  name: string;
  article: string;
  category: AllProductsCategoryFilter;
  status: AllProductsStatusFilter;
  addedToMyPharmacy: AllProductsAddedToMyPharmacyFilter;
}>;

//===================================================================

export const DEFAULT_ALL_PRODUCTS_FILTERS: AllProductsFilterState = {
  createdDate: {
    from: '',
    to: '',
  },
  name: '',
  article: '',
  category: 'all',
  status: 'all',
  addedToMyPharmacy: 'all',
};
