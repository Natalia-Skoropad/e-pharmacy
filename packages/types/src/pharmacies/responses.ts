import type { ApiPaginationResponse } from '../api';
import type { EntityId } from '../primitives';
import type { PharmacyCardSummary } from './pharmacy-card-summary';
import type { PharmacyLocationDraft } from './location';

import type {
  CurrentPharmacySummary,
  MyPharmacyProfile,
} from './pharmacy-profile';

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
  pharmacyId?: string;
  settlement?: string;
  region?: string;
  sort?: PharmaciesSortFilter;
}>;

//=============================================================================

export type PharmaciesResponse = ApiPaginationResponse<PharmacyCardSummary>;

export type PharmacyOption = Readonly<{
  id: EntityId;
  name: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  location?: PharmacyLocationDraft;
}>;

export type PharmacyOptionsResponse = Readonly<{
  items: readonly PharmacyOption[];
}>;

//=============================================================================

export type PharmacyLocationFilterOption = Readonly<{
  settlement: string;
  region?: string;
  label: string;
}>;

export type PharmacyFilterOptionsResponse = Readonly<{
  locations: readonly PharmacyLocationFilterOption[];

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

export type CurrentPharmacySummaryResponse = Readonly<{
  pharmacy: CurrentPharmacySummary | null;
}>;

export type PharmacyProfileResponse = Readonly<{
  pharmacy: MyPharmacyProfile;
}>;

export type SendPharmacyForVerificationResponse = Readonly<{
  pharmacy: MyPharmacyProfile;
  message: string;
}>;

//=============================================================================

// Server-filtered, bounded options for shared search comboboxes.
export type PharmacySearchOptionsParams = Readonly<{
  kind: 'pharmacy' | 'location';
  page?: number;
  perPage?: number;
  query?: string;
  pharmacyId?: string;
  settlement?: string;
  region?: string;
  selectedId?: string;
}>;

//=============================================================================

export type PharmacySearchOptionsResponse =
  | Readonly<{
      kind: 'pharmacy';
      items: readonly PharmacyOption[];
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    }>
  | Readonly<{
      kind: 'location';
      items: readonly PharmacyLocationFilterOption[];
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    }>;
