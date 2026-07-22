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
  receiptEmail?: string;
  paymentPurpose: string;
};

export type PharmacyVerificationDocumentMetadata = {
  name: string;
  size: number;
  type: string;
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
  bankTransferAvailable: boolean;
  bankDetails?: PharmacyBankDetails;
  updatedAt: ISODateString;
};

export type PharmacyCheckoutDetails = {
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankTransferAvailable: boolean;
  bankDetails?: PharmacyBankDetails;
};

export type PharmacyPendingModeration = {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string | null;
  description?: string;
  documents?: PharmacyVerificationDocumentMetadata[];
  bankDetails?: Partial<PharmacyBankDetails>;
};

export type PharmacyModerationDetails = {
  status: PharmacyStatus;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
};

export type PharmacyProfile = {
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  bankTransferAvailable: boolean;
  documents: PharmacyVerificationDocumentMetadata[];
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
  reviewsCount: number;
  updatedAt: ISODateString;
};

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

export type PharmaciesResponse = ApiPaginationResponse<PublicPharmacy>;
export type PharmacyFilterOption = { value: string; label: string };
export type PharmacyOption = { id: EntityId; name: string };
export type PharmacyOptionsResponse = { items: PharmacyOption[] };
export type FavoritePharmacyIdsResponse = { ids: EntityId[] };

//=============================================================================

export type PharmacyFilterOptionsResponse = {
  cities: PharmacyFilterOption[];
  sort: Array<{ value: PharmaciesSortFilter; label: string }>;
};

export type PharmacyDetailsResponse = { pharmacy: PublicPharmacy };

export type PharmacyCheckoutDetailsResponse = {
  pharmacy: PharmacyCheckoutDetails;
};

export type PharmacyReviewsResponse = {
  items: PharmacyReview[];
  total: number;
};

export type PendingReviewsQueryParams = {
  page?: number;
  perPage?: number;
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

export type ModeratePharmacyReviewResponse = {
  message: string;
  rating: number;
  reviewsCount: number;
  moderatedAt?: ISODateString;
};

export type CreatePharmacyByAdminPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
};

export type UpdatePharmacyStatusPayload = {
  status: PharmacyStatus;
  reason?: string;
};

export type UpdateMyPharmacyProfilePayload = {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string | null;
  description?: string;
  documents?: PharmacyVerificationDocumentMetadata[];
  bankDetails?: Partial<PharmacyBankDetails>;
};

export type PharmacyProfileResponse = {
  pharmacy: PharmacyProfile;
};

export type SendPharmacyForVerificationResponse = {
  pharmacy: PharmacyProfile;
  message: string;
};
