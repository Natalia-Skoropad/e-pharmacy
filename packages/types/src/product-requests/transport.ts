import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from '../products';
import type { ProductRequestFile } from './payload';
import type { ProductRequestStatus } from './status';

//=============================================================================

/** Raw history shape guaranteed by the product-request API. */
export type ProductRequestHistoryResponseDto = Readonly<{
  id: EntityId;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: ISODateTimeString;
}>;

//=============================================================================

/** Raw transport shape returned by product-request endpoints. */
export type ProductRequestResponseDto = Readonly<{
  id: EntityId;
  createdAt: ISODateTimeString;
  updatedAt?: ISODateTimeString;
  requestNumber?: string;
  productId?: EntityId;
  productImageUrl?: string;
  productArticle?: string;
  productName?: string;
  article: string;
  name: string;
  category: ProductCategory;
  customCategory?: string;
  status: ProductRequestStatus;
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
  additionalFiles?: readonly ProductRequestFile[];
  rejectionReason?: string;
  history?: readonly ProductRequestHistoryResponseDto[];
  commentsTotal?: number;
}>;
