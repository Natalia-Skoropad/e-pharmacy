import { createBffRoutePair } from './bff';

import type { EntityId } from '@e-pharmacy/types';

//===================================================================

export const API_HEADERS = {
  json: {
    'Content-Type': 'application/json',
  },
} as const;

//===================================================================

export const apiRoutes = {
  health: '/health',

  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    current: '/auth/current',
    password: '/auth/current/password',
    forgotPassword: '/auth/request-reset-email',
    resetPassword: '/auth/reset-password',
  },

  stores: {
    list: '/stores',
    filters: '/stores/filters',
    details: (storeId: EntityId) => `/stores/${storeId}`,
    reviews: (storeId: EntityId) => `/stores/${storeId}/reviews`,
    favorite: (storeId: EntityId) => `/stores/${storeId}/favorite`,
  },

  products: {
    list: '/products',
    filters: '/products/filters',
    details: (productId: EntityId | string) => `/products/${productId}`,
    reviews: (productId: EntityId) => `/products/${productId}/reviews`,
    favorite: (productId: EntityId) => `/products/${productId}/favorite`,
  },

  cart: {
    current: '/cart',
    addItem: '/cart/items',
    updateItem: (cartItemId: EntityId) => `/cart/items/${cartItemId}`,
    removeItem: (cartItemId: EntityId) => `/cart/items/${cartItemId}`,
    clear: '/cart/clear',
    offer: (productId: EntityId, storeId: EntityId) =>
      `/cart/products/${productId}/stores/${storeId}`,
  },

  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
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
    vendorStatus: (vendorId: EntityId) => `/admin/vendors/${vendorId}/status`,
    shops: '/admin/shops',
    shopStatus: (shopId: EntityId) => `/admin/shops/${shopId}/status`,
  },
} as const;

//===================================================================

export const clientApiRoutes = {
  health: '/api/health',

  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
    refresh: '/api/auth/refresh',
    current: '/api/auth/me',
    password: '/api/auth/password',
    forgotPassword: '/api/auth/request-reset-email',
    resetPassword: '/api/auth/reset-password',
  },

  stores: {
    list: '/api/stores',
    filters: '/api/stores/filters',
    details: (storeId: EntityId) => `/api/stores/${storeId}`,
    reviews: (storeId: EntityId) => `/api/stores/${storeId}/reviews`,
    favorite: (storeId: EntityId) => `/api/stores/${storeId}/favorite`,
  },

  products: {
    list: '/api/products',
    filters: '/api/products/filters',
    details: (productId: EntityId | string) => `/api/products/${productId}`,
    reviews: (productId: EntityId) => `/api/products/${productId}/reviews`,
    favorite: (productId: EntityId) => `/api/products/${productId}/favorite`,
  },

  cart: {
    current: '/api/cart',
    addItem: '/api/cart/items',
    updateItem: (cartItemId: EntityId) => `/api/cart/items/${cartItemId}`,
    removeItem: (cartItemId: EntityId) => `/api/cart/items/${cartItemId}`,
    clear: '/api/cart/clear',
  },

  orders: {
    checkout: '/api/orders/checkout',
    list: '/api/orders',
    details: (orderId: EntityId) => `/api/orders/${orderId}`,
  },
} as const;

//===================================================================

export const routePairs = {
  auth: {
    register: createBffRoutePair(apiRoutes.auth.register),
    login: createBffRoutePair(apiRoutes.auth.login),
    logout: createBffRoutePair(apiRoutes.auth.logout),
    logoutAll: createBffRoutePair(apiRoutes.auth.logoutAll),
    refresh: createBffRoutePair(apiRoutes.auth.refresh),
    current: {
      backendPath: apiRoutes.auth.current,
      clientPath: clientApiRoutes.auth.current,
    },
  },
} as const;
