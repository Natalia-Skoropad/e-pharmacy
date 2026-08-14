import { encodeRouteSegment } from '@e-pharmacy/api-client/contracts';
import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';

//===================================================================

const segment = (value: string): string => encodeRouteSegment(value);

//===================================================================

export const pharmacyApiRoutes = {
  products: {
    list: '/api/products',
    details: (productId: string) => `/api/products/${segment(productId)}`,
    myPharmacy: (productId: string) =>
      `/api/products/${segment(productId)}/my-pharmacy`,
    stockMovements: (productId: string) =>
      `/api/products/${segment(productId)}/stock-movements`,
    reviews: (productId: string) =>
      `/api/products/${segment(productId)}/reviews`,
  },

  orders: {
    list: '/api/orders',
    salesStatistics: '/api/orders/sales-statistics',
    details: (orderId: string) => `/api/orders/${segment(orderId)}`,
    status: (orderId: string) => `/api/orders/${segment(orderId)}/status`,
    comments: (orderId: string) => `/api/orders/${segment(orderId)}/comments`,

    comment: (orderId: string, commentId: string) =>
      `/api/orders/${segment(orderId)}/comments/${segment(commentId)}`,
  },

  clients: {
    list: '/api/clients',
    details: (clientId: string) => `/api/clients/${segment(clientId)}`,

    products: (clientId: string) =>
      `/api/clients/${segment(clientId)}/products`,
  },

  productRequests: {
    list: '/api/product-requests',
    articleAvailability: '/api/product-requests/article-availability',

    details: (requestId: string) =>
      `/api/product-requests/${segment(requestId)}`,
  },

  pharmacyNotes: {
    list: (entityType: PharmacyNoteEntityType, entityId: string) =>
      `/api/pharmacy-notes/${segment(entityType)}/${segment(entityId)}`,

    details: (
      entityType: PharmacyNoteEntityType,
      entityId: string,
      noteId: string
    ) =>
      `/api/pharmacy-notes/${segment(entityType)}/${segment(entityId)}/${segment(noteId)}`,
  },

  pharmacies: {
    myProfile: '/api/pharmacies/me/profile',
    myDocumentUpload: '/api/pharmacies/me/documents',
    myDocument: (documentId: string) =>
      `/api/pharmacies/me/documents/${segment(documentId)}`,
    sendMyProfileForVerification:
      '/api/pharmacies/me/profile/send-for-verification',
    submitMyProfileForModeration:
      '/api/pharmacies/me/profile/moderation-submission',
  },

  auth: {
    current: localAuthApiRoutes.current,
    logout: localAuthApiRoutes.logout,
    logoutAll: localAuthApiRoutes.logoutAll,
    refresh: localAuthApiRoutes.refresh,
    password: localAuthApiRoutes.password,
    sessions: localAuthApiRoutes.sessions,
    session: localAuthApiRoutes.session,
  },
} as const;
