import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategoryReference } from '../reference-data';
import type { ProductStatus } from './product-summary';

//===================================================================

export type ProductCardSummary = Readonly<{
  id: EntityId;
  name: string;
  publicSlugId: string;
  article: string;
  category: ProductCategoryReference;
  status: ProductStatus;
  price: number;
  minPrice: number | null;
  maxPrice: number | null;
  imageUrl?: string;
  manufacturer?: string;
  foundInPharmaciesCount: number;
  availableInPharmaciesCount: number;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  isFavorite: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}>;
