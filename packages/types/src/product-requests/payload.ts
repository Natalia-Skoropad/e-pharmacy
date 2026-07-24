import type { FileMetadata } from '../primitives';
import type { ProductCategory } from '../products';
import type { ProductRequestStatus } from './status';

//=============================================================================

export type ProductRequestFile = FileMetadata &
  Readonly<{
    dataUrl?: string;
  }>;

//=============================================================================

export type ProductRequestFormPayload = Readonly<{
  status: Extract<ProductRequestStatus, 'draft' | 'new'>;
  name: string;
  article: string;
  category: ProductCategory;
  customCategory?: string;
  productImage?: ProductRequestFile;
  manufacturer?: string;
  countryOfOrigin?: string;
  dosage?: string;
  packageSize?: string;
  form?: string;
  activeSubstance?: string;
  prescriptionType?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  additionalFiles?: ProductRequestFile[];
}>;
