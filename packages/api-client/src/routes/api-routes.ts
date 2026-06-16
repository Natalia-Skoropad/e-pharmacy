import { createBffRoutePair } from './bff-routes';
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
    forgotPassword: '/auth/request-reset-email',
    resetPassword: '/auth/reset-password',
  },

  pharmacies: {
    list: '/pharmacies',
    filters: '/pharmacies/filters',
    details: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}`,
    reviews: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}/reviews`,
    favorite: (pharmacyId: EntityId) => `/pharmacies/${pharmacyId}/favorite`,
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
    offer: (productId: EntityId, pharmacyId: EntityId) =>
      `/cart/products/${productId}/pharmacies/${pharmacyId}`,
  },

  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
    details: (orderId: EntityId) => `/orders/${orderId}`,
  },

  pharmacy: {
    list: '/pharmacy',
    details: (pharmacyId: EntityId) => `/pharmacy/${pharmacyId}`,
    products: (pharmacyId: EntityId) => `/pharmacy/${pharmacyId}/products`,
    product: (pharmacyId: EntityId, productId: EntityId) =>
      `/pharmacy/${pharmacyId}/products/${productId}`,
    statistics: (pharmacyId: EntityId) => `/pharmacy/${pharmacyId}/statistics`,
    clientGoods: (pharmacyId: EntityId) =>
      `/pharmacy/${pharmacyId}/client-goods`,
  },

  admin: {
    pharmacies: '/admin/pharmacies',
    updatePharmacyStatus: (pharmacyId: EntityId) =>
      `/admin/pharmacies/${pharmacyId}/status`,
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
    sessions: '/api/auth/sessions',
    session: (sessionId: EntityId) => `/api/auth/sessions/${sessionId}`,
    forgotPassword: '/api/auth/request-reset-email',
    resetPassword: '/api/auth/reset-password',
  },

  pharmacies: {
    list: '/api/pharmacies',
    filters: '/api/pharmacies/filters',
    details: (pharmacyId: EntityId) => `/api/pharmacies/${pharmacyId}`,
    reviews: (pharmacyId: EntityId) => `/api/pharmacies/${pharmacyId}/reviews`,
    favorite: (pharmacyId: EntityId) =>
      `/api/pharmacies/${pharmacyId}/favorite`,
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
