export type StoreBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

//===================================================================

export type Store = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: StoreBankDetails;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  isActive: boolean;
};

//===================================================================

export type StoreReview = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

//===================================================================

export type StoresSortFilter =
  | 'newest'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

//===================================================================

export type StoresResponse = {
  items: Store[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

//===================================================================

export type StoreDetailsResponse = {
  store: Store;
};

//===================================================================

export type StoreReviewsResponse = {
  items: StoreReview[];
  total: number;
};

//===================================================================

export type CreateStoreReviewPayload = {
  rating: number;
  comment: string;
};

//===================================================================

export type CreateStoreReviewResponse = {
  message: string;
};

//===================================================================

export type ToggleFavoriteStoreResponse = {
  isFavorite: boolean;
  message: string;
};
