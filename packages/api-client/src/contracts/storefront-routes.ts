import type { EntityId } from '@e-pharmacy/types';

//===================================================================

export const storefrontRoutes = {
  health: '/health',

  pharmacies: {
    list: '/pharmacies',
    myProfile: '/pharmacies/me/profile',

    sendMyProfileForVerification:
      '/pharmacies/me/profile/send-for-verification',

    options: '/pharmacies/options',
    favorites: '/pharmacies/favorites',
    favoriteIds: '/pharmacies/favorites/ids',
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
    favoriteIds: '/products/favorites/ids',
    filters: '/products/filters',
    details: (productId: EntityId) => `/products/${productId}`,

    addToMyPharmacy: (productId: EntityId) =>
      `/products/${productId}/my-pharmacy`,

    removeFromMyPharmacy: (productId: EntityId) =>
      `/products/${productId}/my-pharmacy`,

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
    salesStatistics: '/orders/sales-statistics',
    details: (orderId: EntityId) => `/orders/${orderId}`,
    comments: (orderId: EntityId) => `/orders/${orderId}/comments`,
    
    comment: (orderId: EntityId, commentId: EntityId) =>
      `/orders/${orderId}/comments/${commentId}`,
  },

  clients: {
    list: '/clients',
    details: (clientId: EntityId) => `/clients/${clientId}`,
  },

  productRequests: {
    list: '/product-requests',
    details: (requestId: EntityId) => `/product-requests/${requestId}`,
  },
} as const;
