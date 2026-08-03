import type { ApiPaginationResponse } from '../api';
import type { EntityId } from '../primitives';
import type { PharmacyCardSummary } from './pharmacy-card-summary';
import type { PharmacyProfile } from './pharmacy-profile';

import type {
  PharmacyCheckoutDetails,
  PublicPharmacy,
} from './public-pharmacy';

//=============================================================================

export type PharmaciesSortFilter =
  | 'newest'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

//=============================================================================

export type PharmaciesQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: PharmaciesSortFilter;
}>;

//=============================================================================

export type PharmaciesResponse = ApiPaginationResponse<PharmacyCardSummary>;
export type PharmacyOption = Readonly<{ id: EntityId; name: string }>;

export type PharmacyOptionsResponse = Readonly<{
  items: readonly PharmacyOption[];
}>;

//=============================================================================

type PharmacyFilterOption = Readonly<{ value: string; label: string }>;

export type PharmacyFilterOptionsResponse = Readonly<{
  cities: readonly PharmacyFilterOption[];
  sort: readonly Readonly<{
    value: PharmaciesSortFilter;
    label: string;
  }>[];
}>;

//=============================================================================

export type PharmacyDetailsResponse = Readonly<{
  pharmacy: PublicPharmacy;
}>;

export type PharmacyCheckoutDetailsResponse = Readonly<{
  pharmacy: PharmacyCheckoutDetails;
}>;

//=============================================================================

export type PendingPharmacyReviewTarget = Readonly<{
  pharmacyId: EntityId;
  pharmacyName: string;
}>;

export type PharmacyProfileResponse = Readonly<{
  pharmacy: PharmacyProfile;
}>;

export type SendPharmacyForVerificationResponse = Readonly<{
  pharmacy: PharmacyProfile;
  message: string;
}>;
