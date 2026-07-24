import { localAuthApiRoutes } from '@e-pharmacy/api-client/contracts';

//===================================================================

const segment = (value: string): string => encodeURIComponent(value);

//===================================================================

export const pharmacyApiRoutes = {
  products: {
    list: '/api/products',
    details: (productId: string) => `/api/products/${segment(productId)}`,

    addToMyPharmacy: (productId: string) =>
      `/api/products/${segment(productId)}/my-pharmacy`,

    removeFromMyPharmacy: (productId: string) =>
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

    details: (requestId: string) =>
      `/api/product-requests/${segment(requestId)}`,
  },

  pharmacies: {
    myProfile: '/api/pharmacies/me/profile',

    sendMyProfileForVerification:
      '/api/pharmacies/me/profile/send-for-verification',
  },

  auth: localAuthApiRoutes,
} as const;
