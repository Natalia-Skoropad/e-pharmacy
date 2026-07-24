import type { EntityId } from '@e-pharmacy/types/primitives';

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
    sessions: '/api/auth/sessions',
    session: (sessionId: EntityId) => `/api/auth/sessions/${sessionId}`,
    passwordResetRequest: '/api/auth/password-reset/request',
    passwordResetConfirm: '/api/auth/password-reset/confirm',
  },

  pharmacies: {
    list: '/api/pharmacies',
    options: '/api/pharmacies/options',
    favorites: '/api/pharmacies/favorites',
    favoriteIds: '/api/pharmacies/favorites/ids',
    filters: '/api/pharmacies/filters',
    details: (id: EntityId) => `/api/pharmacies/${id}`,
    checkoutDetails: (id: EntityId) => `/api/pharmacies/${id}/checkout-details`,
    reviews: (id: EntityId) => `/api/pharmacies/${id}/reviews`,
    favorite: (id: EntityId) => `/api/pharmacies/${id}/favorite`,
  },

  products: {
    list: '/api/products',
    favorites: '/api/products/favorites',
    favoriteIds: '/api/products/favorites/ids',
    filters: '/api/products/filters',
    details: (id: EntityId | string) => `/api/products/${id}`,
    reviews: (id: EntityId) => `/api/products/${id}/reviews`,
    favorite: (id: EntityId) => `/api/products/${id}/favorite`,
  },

  cart: {
    current: '/api/cart',
    addItem: '/api/cart/items',
    updateItem: (id: EntityId) => `/api/cart/items/${id}`,
    removeItem: (id: EntityId) => `/api/cart/items/${id}`,
    clear: '/api/cart/clear',
  },

  orders: {
    checkout: '/api/orders/checkout',
    list: '/api/orders',
    details: (id: EntityId) => `/api/orders/${id}`,
  },
} as const;
