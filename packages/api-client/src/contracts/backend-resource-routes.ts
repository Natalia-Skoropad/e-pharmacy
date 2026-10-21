import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';
import type { EntityId } from '@e-pharmacy/types/primitives';

import { encodeRouteSegment } from './route-segment';

//===================================================================

const segment = (value: string): string => encodeRouteSegment(value);

//===================================================================

export const backendRoutes = {
  health: '/health',

  admin: {
    accessMe: '/admin/access/me',

    employees: {
      myProfile: '/admin/employees/me/profile',
      myDocuments: '/admin/employees/me/documents',

      myDocument: (documentId: EntityId) =>
        `/admin/employees/me/documents/${segment(documentId)}`,

      myComments: '/admin/employees/me/comments',

      myComment: (commentId: EntityId) =>
        `/admin/employees/me/comments/${segment(commentId)}`,
    },

    pharmacyDocuments: {
      list: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/documents`,

      download: (pharmacyId: EntityId, documentId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/documents/${segment(documentId)}`,
    },

    pharmacyComments: {
      list: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/comments`,

      detail: (pharmacyId: EntityId, commentId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/comments/${segment(commentId)}`,
    },

    pharmacyActivity: {
      list: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/activity`,

      actors: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/activity/actors`,

      details: (pharmacyId: EntityId, auditLogId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/activity/${segment(auditLogId)}`,
    },

    pharmacyDetail: {
      details: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}`,

      salesStatistics: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/sales-statistics`,

      decision: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/moderation-decisions`,

      status: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/status`,

      corrections: (pharmacyId: EntityId) =>
        `/admin/pharmacies/${segment(pharmacyId)}/review/corrections`,
    },

    pharmacyRegistry: {
      list: '/admin/pharmacies',
      summary: '/admin/pharmacies/summary',
      options: '/admin/pharmacies/options',
      ownerOptions: '/admin/pharmacies/owner-options',
    },

    pharmacyOwners: {
      list: '/admin/pharmacy-owners',
      summary: '/admin/pharmacy-owners/summary',
      options: '/admin/pharmacy-owners/options',

      details: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}`,

      status: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/status`,

      pharmacies: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/pharmacies`,

      salesStatistics: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/sales-statistics`,

      sessions: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/sessions`,

      documents: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/documents`,

      document: (ownerId: EntityId, documentId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/documents/${segment(documentId)}`,

      comments: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/comments`,

      comment: (ownerId: EntityId, commentId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/comments/${segment(commentId)}`,

      activity: (ownerId: EntityId) =>
        `/admin/pharmacy-owners/${segment(ownerId)}/activity`,
    },

    audit: {
      list: '/admin/audit',
      actors: '/admin/audit/actors',
      details: (auditLogId: EntityId) => `/admin/audit/${segment(auditLogId)}`,
    },

    productCategories: {
      list: '/admin/product-categories',

      details: (categoryId: EntityId) =>
        `/admin/product-categories/${segment(categoryId)}`,
    },

    positions: {
      list: '/admin/positions',

      details: (positionId: EntityId) =>
        `/admin/positions/${segment(positionId)}`,
    },
  },

  pharmacyOwners: {
    myComments: '/pharmacy-owners/me/comments',

    myComment: (commentId: EntityId) =>
      `/pharmacy-owners/me/comments/${segment(commentId)}`,

    myDocuments: '/pharmacy-owners/me/documents',

    myDocument: (documentId: EntityId) =>
      `/pharmacy-owners/me/documents/${segment(documentId)}`,
  },

  productCategories: {
    list: '/product-categories',
  },

  pharmacies: {
    list: '/pharmacies',
    mySummary: '/pharmacies/me/summary',
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

    myMemberships: '/pharmacies/me/memberships',
    ownedRegistry: '/pharmacies/me/pharmacies',
    ownedRegistrySummary: '/pharmacies/me/pharmacies/summary',
    ownedRegistryOptions: '/pharmacies/me/pharmacies/options',

    createDraft: '/pharmacies',

    ownedProfile: (pharmacyId: EntityId) =>
      `/pharmacies/me/pharmacies/${segment(pharmacyId)}/profile`,

    ownedVerification: (pharmacyId: EntityId) =>
      `/pharmacies/me/pharmacies/${segment(pharmacyId)}/send-for-verification`,

    ownedDocuments: (pharmacyId: EntityId) =>
      `/pharmacies/me/pharmacies/${segment(pharmacyId)}/documents`,

    ownedRegistryDetail: (pharmacyId: EntityId) =>
      `/pharmacies/me/pharmacies/${segment(pharmacyId)}`,

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
    managementStatistics: '/products/management/statistics',

    managementDetails: (productId: EntityId) =>
      `/products/management/${segment(productId)}`,

    managementReviews: (productId: EntityId) =>
      `/products/management/${segment(productId)}/reviews`,

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
    statistics: '/product-requests/statistics',
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
