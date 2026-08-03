import type { EntityId } from '../primitives';

//=============================================================================

export type PharmacyCardSummary = Readonly<{
  id: EntityId;
  name: string;
  publicSlugId: string;
  address?: string;
  city?: string;
  phone?: string;
  rating: number;
  imageUrl?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
}>;
