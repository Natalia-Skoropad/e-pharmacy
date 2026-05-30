export type EntityId = string;
export type ISODateString = string;

//===================================================================

export type UserRole = 'customer' | 'vendor' | 'admin';
export type UserStatus = 'active' | 'blocked';
export type VendorAccountStatus = 'pending' | 'active' | 'rejected' | 'blocked';
export type ShopStatus = 'draft' | 'pending_review' | 'active' | 'suspended';

//===================================================================

export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data?: TData;
};

export type ApiErrorResponse = {
  status?: 'error' | 'fail';
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

//===================================================================

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  meta: PaginationMeta;
};

export type ApiPaginationResponse<TItem> = {
  items: TItem[];
} & PaginationMeta;

//===================================================================

export type AuthUser = {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  vendorStatus?: VendorAccountStatus;
  phone?: string;
  address?: string;
  avatarUrl?: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: Extract<UserRole, 'customer'>;
  phone?: string;
  address?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string | null;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

//===================================================================

export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

export type ProductOfferDto = {
  storeId: EntityId;
  storeName: string;
  storeCity?: string;
  storeAddress?: string;
  storePhone?: string;
  storeImageUrl?: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storeIsFavorite?: boolean;
  price: number;
  totalQuantity: number;
  activeQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
};

export type ProductDto = {
  id: EntityId;
  name: string;
  slug?: string;
  article: string;
  description?: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId?: EntityId;
  storeName?: string;
  foundInStoresCount: number;
  offers: ProductOfferDto[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: ISODateString;
};

export type ProductReviewDto = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type ProductsQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  storeId?: EntityId;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?:
    | 'price-asc'
    | 'price-desc'
    | 'rating-desc'
    | 'rating-asc'
    | 'name-asc'
    | 'name-desc'
    | 'newest';
};

export type ProductFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type ProductFilterOptionsResponse = {
  categories: ProductFilterOption<'all' | ProductCategory>[];
  availability: ProductFilterOption<'all' | 'in-stock' | 'out-of-stock'>[];
  sort: ProductFilterOption<NonNullable<ProductsQueryParams['sort']>>[];
};

export type ProductsResponse = ApiPaginationResponse<ProductDto>;
export type ProductDetailsResponse = { product: ProductDto };
export type ProductReviewsResponse = { items: ProductReviewDto[]; total: number };
export type CreateProductReviewPayload = { rating: number; comment: string };
export type CreateProductReviewResponse = { message: string };
export type ToggleFavoriteProductResponse = { isFavorite: boolean; message: string };

//===================================================================

export type StoreBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

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

export type StoresSortFilter =
  | 'newest'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

export type StoresResponse = ApiPaginationResponse<StoreDto>;
export type StoreFilterOption = { value: string; label: string };
export type StoreFilterOptionsResponse = {
  cities: StoreFilterOption[];
  sort: Array<{ value: StoresSortFilter; label: string }>;
};
export type StoreDetailsResponse = { store: StoreDto };
export type StoreReviewsResponse = { items: StoreReviewDto[]; total: number };
export type CreateStoreReviewPayload = { rating: number; comment: string };
export type CreateStoreReviewResponse = { message: string };
export type ToggleFavoriteStoreResponse = { isFavorite: boolean; message: string };

//===================================================================

export type CartItemDto = {
  id: EntityId;
  productId: EntityId;
  storeId: EntityId;
  product: ProductDto;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  price: number;
  totalPrice: number;
  expiresAt: ISODateString;
};

export type CartDto = {
  items: CartItemDto[];
  totalItems: number;
  totalPrice: number;
};

export type OrderStatus = 'accepted' | 'processing' | 'completed' | 'cancelled';
export type OrderPaymentMethod = 'cash' | 'bank-transfer';
export type OrderDeliveryMethod = 'pickup' | 'post';

export type OrderDeliveryDetails = {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
};

export type OrderItemDto = {
  id: EntityId;
  productId: EntityId;
  name: string;
  slug?: string;
  article: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type OrderDto = {
  id: EntityId;
  orderNumber: string;
  createdAt: ISODateString;
  storeId: EntityId;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  totalItems: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
  bankDetails?: StoreBankDetails;
  items: OrderItemDto[];
};

export type OrdersResponse = {
  items: OrderDto[];
  total: number;
};

//===================================================================

export type VendorShopDto = StoreDto & {
  ownerId: EntityId;
  status: ShopStatus;
  createdAt?: ISODateString;
  approvedBy?: EntityId;
  approvedAt?: ISODateString;
};

export type VendorProductDto = ProductDto & {
  ownedOffer: ProductOfferDto;
};

export type VendorStatisticsDto = {
  totalProducts: number;
  activeProducts: number;
  reservedItems: number;
  ordersCount: number;
  revenue: number;
};

export type ClientGoodsDto = {
  orderId: EntityId;
  productId: EntityId;
  productName: string;
  quantity: number;
  customerName?: string;
  status: OrderStatus;
  createdAt: ISODateString;
};
