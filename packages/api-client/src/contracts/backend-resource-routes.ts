import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';
import type { EntityId } from '@e-pharmacy/types/primitives';

import { encodeRouteSegment } from './route-segment';

//===================================================================

const segment = (value: string): string => encodeRouteSegment(value);

//===================================================================

export const backendRoutes = {
  health: '/health',

  pharmacies: {
    list: '/pharmacies',
    myProfile: '/pharmacies/me/profile',
    myDocumentUpload: '/pharmacies/me/documents',

    myDocument: (documentId: EntityId) =>
      `/pharmacies/me/documents/${segment(documentId)}`,

    sendMyProfileForVerification:
      '/pharmacies/me/profile/send-for-verification',
    submitMyProfileForModeration:
      '/pharmacies/me/profile/moderation-submission',

    options: '/pharmacies/options',
    favorites: '/pharmacies/favorites',
    favoriteIds: '/pharmacies/favorites/ids',
    filters: '/pharmacies/filters',
    details: (pharmacyId: EntityId) => `/pharmacies/${segment(pharmacyId)}`,

    checkoutDetails: (pharmacyId: EntityId) =>
      `/pharmacies/${segment(pharmacyId)}/checkout-details`,

    reviews: (pharmacyId: EntityId) =>
      `/pharmacies/${segment(pharmacyId)}/reviews`,

    favorite: (pharmacyId: EntityId) =>
      `/pharmacies/${segment(pharmacyId)}/favorite`,
  },

  products: {
    list: '/products',
    managementList: '/products/management',

    managementDetails: (productId: EntityId) =>
      `/products/management/${segment(productId)}`,

    favorites: '/products/favorites',
    favoriteIds: '/products/favorites/ids',
    filters: '/products/filters',
    details: (productId: EntityId) => `/products/${segment(productId)}`,

    myPharmacy: (productId: EntityId) =>
      `/products/${segment(productId)}/my-pharmacy`,

    stockMovements: (productId: EntityId) =>
      `/products/${segment(productId)}/stock-movements`,

    reviews: (productId: EntityId) => `/products/${segment(productId)}/reviews`,

    favorite: (productId: EntityId) =>
      `/products/${segment(productId)}/favorite`,
  },

  cart: {
    current: '/cart',
    addItem: '/cart/items',
    item: (cartItemId: EntityId) => `/cart/items/${segment(cartItemId)}`,

    pharmacy: (pharmacyId: EntityId) =>
      `/cart/pharmacies/${segment(pharmacyId)}`,

    clear: '/cart/clear',
  },

  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
    salesStatistics: '/orders/sales-statistics',
    details: (orderId: EntityId) => `/orders/${segment(orderId)}`,
    status: (orderId: EntityId) => `/orders/${segment(orderId)}/status`,
    comments: (orderId: EntityId) => `/orders/${segment(orderId)}/comments`,

    comment: (orderId: EntityId, commentId: EntityId) =>
      `/orders/${segment(orderId)}/comments/${segment(commentId)}`,
  },

  clients: {
    list: '/clients',
    details: (clientId: EntityId) => `/clients/${segment(clientId)}`,
    products: (clientId: EntityId) => `/clients/${segment(clientId)}/products`,
  },

  productRequests: {
    list: '/product-requests',
    articleAvailability: '/product-requests/article-availability',
    details: (requestId: EntityId) => `/product-requests/${segment(requestId)}`,
  },

  pharmacyNotes: {
    list: (entityType: PharmacyNoteEntityType, entityId: EntityId) =>
      `/pharmacy-notes/${segment(entityType)}/${segment(entityId)}`,

    details: (
      entityType: PharmacyNoteEntityType,
      entityId: EntityId,
      noteId: EntityId
    ) =>
      `/pharmacy-notes/${segment(entityType)}/${segment(entityId)}/${segment(noteId)}`,
  },
} as const;
