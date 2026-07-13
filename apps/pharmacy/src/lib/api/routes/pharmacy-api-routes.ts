export const pharmacyApiRoutes = {
  products: {
    list: '/api/products',
    details: (productId: string) => `/api/products/${productId}`,

    addToMyPharmacy: (productId: string) =>
      `/api/products/${productId}/my-pharmacy`,

    removeFromMyPharmacy: (productId: string) =>
      `/api/products/${productId}/my-pharmacy`,

    stockMovements: (productId: string) =>
      `/api/products/${productId}/stock-movements`,

    reviews: (productId: string) => `/api/products/${productId}/reviews`,
  },

  orders: {
    list: '/api/orders',
    salesStatistics: '/api/orders/sales-statistics',
    details: (orderId: string) => `/api/orders/${orderId}`,
    status: (orderId: string) => `/api/orders/${orderId}/status`,
    comments: (orderId: string) => `/api/orders/${orderId}/comments`,

    comment: (orderId: string, commentId: string) =>
      `/api/orders/${orderId}/comments/${commentId}`,
  },

  clients: {
    list: '/api/clients',
    details: (clientId: string) => `/api/clients/${clientId}`,
  },

  productRequests: {
    list: '/api/product-requests',
    details: (requestId: string) => `/api/product-requests/${requestId}`,
  },

  pharmacies: {
    myProfile: '/api/pharmacies/me/profile',
    sendMyProfileForVerification:
      '/api/pharmacies/me/profile/send-for-verification',
  },

  auth: {
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
    refresh: '/api/auth/refresh',
    current: '/api/auth/me',
    password: '/api/auth/password',
    sessions: '/api/auth/sessions',
    session: (sessionId: string) => `/api/auth/sessions/${sessionId}`,
  },
} as const;
