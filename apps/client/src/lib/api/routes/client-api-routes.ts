import { localAuthApiRoutes } from '@e-pharmacy/api-client/contracts';
import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

const segment = (value: string): string => encodeURIComponent(value);

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
    details: (id: EntityId) => `/api/pharmacies/${segment(id)}`,

    checkoutDetails: (id: EntityId) =>
      `/api/pharmacies/${segment(id)}/checkout-details`,

    reviews: (id: EntityId) => `/api/pharmacies/${segment(id)}/reviews`,
    favorite: (id: EntityId) => `/api/pharmacies/${segment(id)}/favorite`,
  },

  products: {
    list: '/api/products',
    favorites: '/api/products/favorites',
    favoriteIds: '/api/products/favorites/ids',
    filters: '/api/products/filters',
    details: (id: EntityId | string) => `/api/products/${segment(id)}`,
    reviews: (id: EntityId) => `/api/products/${segment(id)}/reviews`,
    favorite: (id: EntityId) => `/api/products/${segment(id)}/favorite`,
  },

  cart: {
    current: '/api/cart',
    addItem: '/api/cart/items',
    updateItem: (id: EntityId) => `/api/cart/items/${segment(id)}`,
    removeItem: (id: EntityId) => `/api/cart/items/${segment(id)}`,
    clear: '/api/cart/clear',
  },

  orders: {
    checkout: '/api/orders/checkout',
    list: '/api/orders',
    details: (id: EntityId) => `/api/orders/${segment(id)}`,
  },
} as const;
