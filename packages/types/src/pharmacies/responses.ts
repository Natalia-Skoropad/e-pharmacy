import type { ApiPaginationResponse } from '../api';
import type { EntityId } from '../primitives';
import type { Review } from '../reviews';
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

export type PharmaciesQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: PharmaciesSortFilter;
};

//=============================================================================

export type PharmaciesResponse = ApiPaginationResponse<PublicPharmacy>;
export type PharmacyOption = { id: EntityId; name: string };
export type PharmacyOptionsResponse = { items: PharmacyOption[] };

//=============================================================================

export type PharmacyFilterOption = { value: string; label: string };
export type PharmacyFilterOptionsResponse = {
  cities: PharmacyFilterOption[];
  sort: Array<{ value: PharmaciesSortFilter; label: string }>;
};

//=============================================================================

export type PharmacyDetailsResponse = { pharmacy: PublicPharmacy };
export type PharmacyCheckoutDetailsResponse = {
  pharmacy: PharmacyCheckoutDetails;
};

//=============================================================================

export type PharmacyReviewsResponse = {
  items: Review[];
  total: number;
};

export type PendingPharmacyReviewTarget = {
  pharmacyId: EntityId;
  pharmacyName: string;
};

export type PharmacyProfileResponse = {
  pharmacy: PharmacyProfile;
};

export type SendPharmacyForVerificationResponse = {
  pharmacy: PharmacyProfile;
  message: string;
};
