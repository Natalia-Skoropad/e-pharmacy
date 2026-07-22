import type { ProductCategory } from '@e-pharmacy/types/products';
import type { ProductRequestFile } from '@e-pharmacy/types/product-requests';

import type { FormErrors } from '../shared';

//===================================================================

export type ProductRequestValidationMode = 'draft' | 'moderation';

//===================================================================

export type ProductRequestFormValues = {
  name: string;
  article: string;
  category: ProductCategory;
  customCategory: string;
  manufacturer: string;
  countryOfOrigin: string;
  dosage: string;
  packageSize: string;
  form: string;
  activeSubstance: string;
  prescriptionType: string;
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
  category: 'medicine',
  customCategory: '',
  manufacturer: '',
  countryOfOrigin: '',
  dosage: '',
  packageSize: '',
  form: '',
  activeSubstance: '',
  prescriptionType: '',
  fullDescription: '',
  pharmacyComment: '',
};
