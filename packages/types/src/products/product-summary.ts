import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from './category';

//===================================================================

export type ProductStatus = 'new' | 'active' | 'blocked';

//===================================================================

export type ProductSummary = {
  id: EntityId;
  name: string;
  slug?: string;
  article: string;
  category: ProductCategory;
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
};
