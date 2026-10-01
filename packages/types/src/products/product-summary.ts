import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategoryReference } from '../reference-data';

//===================================================================

export type ProductStatus = 'new' | 'active' | 'blocked';

//===================================================================

export type ProductSummary = Readonly<{
  id: EntityId;
  name: string;
  publicSlugId: string;
  slug?: string;
  article: string;
  category: ProductCategoryReference;
  status: ProductStatus;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  foundInPharmaciesCount: number;
  availableInPharmaciesCount: number;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  isFavorite: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}>;
