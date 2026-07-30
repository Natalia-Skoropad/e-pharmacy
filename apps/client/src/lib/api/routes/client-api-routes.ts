import { encodeRouteSegment } from '@e-pharmacy/api-client/contracts';
import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';
import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

export const clientApiRoutes = {
  health: '/api/health',
  auth: localAuthApiRoutes,

  pharmacies: {
    list: '/api/pharmacies',
    options: '/api/pharmacies/options',
    favorites: '/api/pharmacies/favorites',
    favoriteIds: '/api/pharmacies/favorites/ids',
    filters: '/api/pharmacies/filters',
    details: (id: EntityId) => `/api/pharmacies/${encodeRouteSegment(id)}`,

    checkoutDetails: (id: EntityId) =>
      `/api/pharmacies/${encodeRouteSegment(id)}/checkout-details`,

    reviews: (id: EntityId) => `/api/pharmacies/${encodeRouteSegment(id)}/reviews`,
    favorite: (id: EntityId) => `/api/pharmacies/${encodeRouteSegment(id)}/favorite`,
  },

  products: {
    list: '/api/products',
    favorites: '/api/products/favorites',
    favoriteIds: '/api/products/favorites/ids',
    filters: '/api/products/filters',
    details: (id: EntityId) => `/api/products/${encodeRouteSegment(id)}`,
    reviews: (id: EntityId) => `/api/products/${encodeRouteSegment(id)}/reviews`,
    favorite: (id: EntityId) => `/api/products/${encodeRouteSegment(id)}/favorite`,
  },

  cart: {
    current: '/api/cart',
    addItem: '/api/cart/items',
    item: (id: EntityId) => `/api/cart/items/${encodeRouteSegment(id)}`,
    clear: '/api/cart/clear',
  },

  orders: {
    checkout: '/api/orders/checkout',
    list: '/api/orders',
    details: (id: EntityId) => `/api/orders/${encodeRouteSegment(id)}`,
  },
} as const;
