import type { EntityId, ISODateTimeString } from '../primitives';
import type { PharmacyLocationDraft } from '../pharmacies/location';

//===================================================================

export type ProductOffer = Readonly<{
  id: EntityId;
  pharmacyId: EntityId;
  pharmacyName: string;
  pharmacyLocation?: PharmacyLocationDraft;
  pharmacyPhone?: string;
  pharmacyImageUrl?: string;
  pharmacyRating: number;
  pharmacyReviewsCount: number;
  pharmacyIsFavorite: boolean;
  price: number;
  totalQuantity?: number;
  availableQuantity: number;
  reservedQuantity?: number;
  inStock: boolean;
  hasRelatedOrders?: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}>;
