import type { EntityId } from '../primitives';
import type { PharmacyLocationDraft } from './location';

//=============================================================================

export type PharmacyCardSummary = Readonly<{
  id: EntityId;
  name: string;
  publicSlugId: string;
  location?: PharmacyLocationDraft;
  email?: string;
  phone?: string;
  rating: number;
  imageUrl?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
}>;
