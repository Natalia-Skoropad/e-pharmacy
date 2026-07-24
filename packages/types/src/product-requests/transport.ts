import type { EntityId } from '../primitives';
import type { ProductRequestFile } from './payload';

//=============================================================================

/** Raw transport shape. External values remain optional until runtime parsing succeeds. */
export type ProductRequestHistoryResponseDto = Readonly<{
  id?: EntityId;
  _id?: EntityId;
  status?: unknown;
  title?: string;
  description?: string;
  createdAt?: string;
}>;

//=============================================================================

/** Raw transport shape returned by product-request endpoints. */
export type ProductRequestResponseDto = Readonly<{
  id?: EntityId;
  _id?: EntityId;
  createdAt?: string;
  createdDate?: string;
  updatedAt?: string;
  requestNumber?: string;
  productId?: EntityId;
  product?: unknown;
  productImageUrl?: string;
  imageUrl?: string;
  productArticle?: string;
  productName?: string;
  article?: string;
  name?: string;
  category?: unknown;
  customCategory?: string;
  status?: unknown;
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
  rejectionReason?: string;
  history?: ProductRequestHistoryResponseDto[];
  commentsTotal?: number;
}>;
