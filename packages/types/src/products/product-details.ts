import type { EntityId } from '../primitives';

import type { ProductOffer } from './product-offer';
import type { ProductSummary } from './product-summary';

//===================================================================

export type ProductDetails = ProductSummary &
  Readonly<{
    description?: string;
    brand?: string;
    series?: string;
    releaseForm?: string;
    activeIngredients?: string;
    activeIngredientCount?: number;
    pharmacyId?: EntityId;
    pharmacyName?: string;
    offers: readonly ProductOffer[];
    isAddedToOwner?: boolean;
  }>;
