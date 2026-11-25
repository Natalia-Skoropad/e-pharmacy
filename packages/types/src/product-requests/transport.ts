import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategoryReference } from '../reference-data';

import type { ProductRequestCategoryMode, ProductRequestFile } from './payload';
import type { ProductRequestStatus } from './status';

//=============================================================================

/** Raw history shape guaranteed by the product-request API. */
export type ProductRequestHistoryResponseDto = Readonly<{
  id: EntityId;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: ISODateTimeString;
  isInferred: boolean;

  /** Present in authorized request detail and mutation responses. */
  actorName?: string;
  actorNameSource?: 'current_owner';
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
  categoryMode: ProductRequestCategoryMode;
  category?: ProductCategoryReference;
  customCategory?: string;
  status: ProductRequestStatus;
  reviewState?: 'changes_requested';
  cancelledBy?: 'owner' | 'admin';
  productImage?: ProductRequestFile;
  manufacturer?: string;
  brand?: string;
  series?: string;
  releaseForm?: string;
  activeIngredients?: string;
  activeIngredientCount?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  additionalFiles?: readonly ProductRequestFile[];
  rejectionReason?: string;
  history?: readonly ProductRequestHistoryResponseDto[];
  commentsTotal?: number;
}>;
