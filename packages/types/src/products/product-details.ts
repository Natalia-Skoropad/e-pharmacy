import type { EntityId } from '../primitives';
import type { ProductOffer } from './product-offer';
import type { ProductSummary } from './product-summary';

//===================================================================

export type ProductDetails = ProductSummary & {
  description?: string;
  pharmacyId?: EntityId;
  pharmacyName?: string;
  offers: ProductOffer[];
};
