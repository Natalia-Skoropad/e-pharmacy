import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateString } from '../shared';
import type { PharmacyStatus } from '../auth';
import type { ReviewModerationStatus } from '../reviews';

//=============================================================================

export type PharmacyBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

//=============================================================================

export type PharmacyDto = {
  id: EntityId;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  bankTransferAvailable: boolean;
  status?: PharmacyStatus;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  isActive: boolean;
  updatedAt?: ISODateString;
};

export type PharmacyReviewDto = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type PendingPharmacyReviewDto = {
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

//=============================================================================

export type PharmaciesResponse = ApiPaginationResponse<PharmacyDto>;
export type PharmacyFilterOption = { value: string; label: string };

export type PharmacyFilterOptionsResponse = {
  cities: PharmacyFilterOption[];
  sort: Array<{ value: PharmaciesSortFilter; label: string }>;
};

export type PharmacyDetailsResponse = { pharmacy: PharmacyDto };

//=============================================================================

export type PharmacyReviewsResponse = { items: PharmacyReviewDto[]; total: number };
export type PendingPharmacyReviewsResponse = {
  items: PendingPharmacyReviewDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
export type CreatePharmacyReviewPayload = { rating: number; comment: string };
export type CreatePharmacyReviewResponse = { message: string };

//=============================================================================

export type ToggleFavoritePharmacyResponse = {
  isFavorite: boolean;
  message: string;
};

export type Pharmacy = PharmacyDto;
export type PharmacyReview = PharmacyReviewDto;
