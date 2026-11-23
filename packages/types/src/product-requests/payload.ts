import type { EntityId, FileMetadata } from '../primitives';
import type { ProductRequestStatus } from './status';

//=============================================================================

export type ProductRequestCategoryMode = 'catalog' | 'custom';

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
  categoryMode: ProductRequestCategoryMode;
  categoryId?: EntityId;
  customCategory?: string;
  productImage?: ProductRequestFile;
  brand?: string;
  series?: string;
  manufacturer?: string;
  releaseForm?: string;
  activeIngredients?: string;
  activeIngredientCount?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  additionalFiles?: ProductRequestFile[];
}>;
