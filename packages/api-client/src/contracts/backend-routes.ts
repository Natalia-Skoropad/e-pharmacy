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
    sessions: '/auth/sessions',
    session: (sessionId: EntityId) => `/auth/sessions/${sessionId}`,
    passwordResetRequest: '/auth/password-reset/request',
    passwordResetConfirm: '/auth/password-reset/confirm',
  },

  pharmacies: {
    list: '/pharmacies',
    options: '/pharmacies/options',
    favorites: '/pharmacies/favorites',
    filters: '/pharmacies/filters',
    details: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}`,
    checkoutDetails: (pharmacyId: EntityId) =>
      `/pharmacies/${pharmacyId}/checkout-details`,
    reviews: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}/reviews`,
    favorite: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}/favorite`,
  },

  products: {
    list: '/products',
    favorites: '/products/favorites',
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
  },

  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
    details: (orderId: EntityId) => `/orders/${orderId}`,
  },
} as const;
