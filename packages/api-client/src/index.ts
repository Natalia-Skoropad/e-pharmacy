import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  EntityId,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  ProductsQueryParams,
} from '@e-pharmacy/types';

export type { ApiErrorResponse, ApiSuccessResponse } from '@e-pharmacy/types';

//===================================================================

export const API_HEADERS = {
  json: {
    'Content-Type': 'application/json',
  },
} as const;

//===================================================================

export function createQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

//===================================================================

export const apiRoutes = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    profile: '/auth/profile',
    password: '/auth/password',
  },

  stores: {
    list: (params: Record<string, string | number | boolean | undefined> = {}) =>
      `/stores${createQueryString(params)}`,
    filters: '/stores/filters',
    details: (storeId: EntityId) => `/stores/${storeId}`,
    reviews: (storeId: EntityId) => `/stores/${storeId}/reviews`,
    favorite: (storeId: EntityId) => `/stores/${storeId}/favorite`,
  },

  products: {
    list: (params: ProductsQueryParams = {}) =>
      `/products${createQueryString(params)}`,
    filters: '/products/filters',
    details: (productIdOrSlug: EntityId | string) => `/products/${productIdOrSlug}`,
    reviews: (productId: EntityId) => `/products/${productId}/reviews`,
    favorite: (productId: EntityId) => `/products/${productId}/favorite`,
  },

  cart: {
    root: '/cart',
    item: (cartItemId: EntityId) => `/cart/items/${cartItemId}`,
    offer: (productId: EntityId, storeId: EntityId) =>
      `/cart/products/${productId}/stores/${storeId}`,
  },

  orders: {
    root: '/orders',
    details: (orderId: EntityId) => `/orders/${orderId}`,
  },

  vendor: {
    shops: '/vendor/shops',
    shop: (shopId: EntityId) => `/vendor/shops/${shopId}`,
    products: (shopId: EntityId) => `/vendor/shops/${shopId}/products`,
    product: (shopId: EntityId, productId: EntityId) =>
      `/vendor/shops/${shopId}/products/${productId}`,
    statistics: (shopId: EntityId) => `/vendor/shops/${shopId}/statistics`,
    clientGoods: (shopId: EntityId) => `/vendor/shops/${shopId}/client-goods`,
  },

  admin: {
    vendors: '/admin/vendors',
    approveVendor: (vendorId: EntityId) => `/admin/vendors/${vendorId}/approve`,
    rejectVendor: (vendorId: EntityId) => `/admin/vendors/${vendorId}/reject`,
    blockVendor: (vendorId: EntityId) => `/admin/vendors/${vendorId}/block`,
    shops: '/admin/shops',
    approveShop: (shopId: EntityId) => `/admin/shops/${shopId}/approve`,
    suspendShop: (shopId: EntityId) => `/admin/shops/${shopId}/suspend`,
  },
} as const;

//===================================================================

export type AuthApiPayloadMap = {
  register: RegisterPayload;
  login: LoginPayload;
  updateProfile: UpdateProfilePayload;
  updatePassword: UpdatePasswordPayload;
};
