import type { EntityId, FileMetadata } from '../primitives';

//=============================================================================

export type ProductRequestCategoryMode = 'catalog' | 'custom';

//=============================================================================

export type ProductRequestFile = FileMetadata &
  Readonly<{
    dataUrl?: string;
    documentId?: EntityId;
  }>;

//=============================================================================

export type ProductRequestFormPayload = Readonly<{
  status: 'new';
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
