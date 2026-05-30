import type { ApiPaginationResponse } from './api';
import type { EntityId, ISODateString } from './base';
import type { ShopStatus } from './auth';
import type { ReviewModerationStatus } from './review';

//=============================================================================

export type StoreBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

//=============================================================================

export type StoreDto = {
  id: EntityId;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: StoreBankDetails;
  bankTransferAvailable: boolean;
  status?: ShopStatus;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  isActive: boolean;
  updatedAt?: ISODateString;
};

export type StoreReviewDto = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type PendingStoreReviewDto = {
  storeId: EntityId;
  storeName: string;
  reviewId: EntityId;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: ISODateString;
};

export type ModerateStoreReviewPayload = {
  status: Extract<ReviewModerationStatus, 'approved' | 'rejected'>;
  reason?: string;
};

export type StoresSortFilter =
  | 'newest'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

//=============================================================================

export type StoresResponse = ApiPaginationResponse<StoreDto>;
export type StoreFilterOption = { value: string; label: string };

export type StoreFilterOptionsResponse = {
  cities: StoreFilterOption[];
  sort: Array<{ value: StoresSortFilter; label: string }>;
};

export type StoreDetailsResponse = { store: StoreDto };

//=============================================================================
export type StoreReviewsResponse = { items: StoreReviewDto[]; total: number };
export type PendingStoreReviewsResponse = {
  items: PendingStoreReviewDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
export type CreateStoreReviewPayload = { rating: number; comment: string };
export type CreateStoreReviewResponse = { message: string };

//=============================================================================

export type ToggleFavoriteStoreResponse = {
  isFavorite: boolean;
  message: string;
};
