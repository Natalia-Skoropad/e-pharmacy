import type { ProductRequestCategoryMode } from '@e-pharmacy/types/product-requests';
import type { ProductRequestFile } from '@e-pharmacy/types/product-requests';

import type { FormErrors } from '../shared';

//===================================================================

export type ProductRequestValidationMode = 'draft' | 'moderation';

//===================================================================

export type ProductRequestFormValues = {
  name: string;
  article: string;
  categoryMode: ProductRequestCategoryMode;
  categoryId: string;
  customCategory: string;
  brand: string;
  series: string;
  manufacturer: string;
  releaseForm: string;
  activeIngredients: string;
  activeIngredientCount: string;
  fullDescription: string;
  pharmacyComment: string;
};

export type ProductRequestFormErrors = FormErrors<ProductRequestFormValues> & {
  productImage?: string;
  additionalFiles?: string;
};

export type ProductRequestFileLike = Readonly<{
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  documentId?: string;
}>;

export type ProductRequestFormValidationContext = Readonly<{
  hasProductImage?: boolean;
  productImage?: ProductRequestFileLike | null;
  additionalFiles?: readonly ProductRequestFileLike[];
}>;

export type ProductRequestPayloadFiles = Readonly<{
  productImage?: ProductRequestFile;
  additionalFiles?: readonly ProductRequestFile[];
}>;

//===================================================================

export const PRODUCT_REQUEST_INITIAL_VALUES: ProductRequestFormValues = {
  name: '',
  article: '',
  categoryMode: 'catalog',
  categoryId: '',
  customCategory: '',
  brand: '',
  series: '',
  manufacturer: '',
  releaseForm: '',
  activeIngredients: '',
  activeIngredientCount: '',
  fullDescription: '',
  pharmacyComment: '',
};
