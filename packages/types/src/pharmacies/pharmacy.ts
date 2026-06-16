import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateString } from '../shared';
import type { ReviewModerationStatus } from '../reviews';
import type { PharmacyStatus } from './status';

//=============================================================================

export type PharmacyBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

export type PublicPharmacy = {
  id: EntityId;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  updatedAt: ISODateString;
};

export type PharmacyCheckoutDetails = {
  bankTransferAvailable: boolean;
  bankDetails?: PharmacyBankDetails;
};

export type PharmacyModerationDetails = {
  status: PharmacyStatus;
};

export type PharmacyProfile = PublicPharmacy &
  PharmacyCheckoutDetails &
  PharmacyModerationDetails;

/** Current storefront API response. Split aliases keep public, checkout and
 * moderation responsibilities explicit until the backend exposes separate
 * serializers for those contexts. */
export type Pharmacy = PharmacyProfile;

export type PharmacyReview = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type PendingPharmacyReview = {
  pharmacyId: EntityId;
  pharmacyName: string;
  reviewId: EntityId;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: ISODateString;
};

export type ModeratePharmacyReviewPayload = {
  status: Extract<ReviewModerationStatus, 'approved' | 'rejected'>;
  reason?: string;
};

export type PharmaciesSortFilter =
  | 'newest'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

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

export type PharmaciesResponse = ApiPaginationResponse<Pharmacy>;
export type PharmacyFilterOption = { value: string; label: string };

//=============================================================================

export type PharmacyFilterOptionsResponse = {
  cities: PharmacyFilterOption[];
  sort: Array<{ value: PharmaciesSortFilter; label: string }>;
};

export type PharmacyDetailsResponse = { pharmacy: Pharmacy };

export type PharmacyReviewsResponse = {
  items: PharmacyReview[];
  total: number;
};

export type PendingPharmacyReviewsResponse = {
  items: PendingPharmacyReview[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

//=============================================================================

export type CreatePharmacyReviewPayload = { rating: number; comment: string };
export type CreatePharmacyReviewResponse = { message: string };

//=============================================================================

export type FavoritePharmacyResponse = {
  isFavorite: boolean;
  message: string;
};
