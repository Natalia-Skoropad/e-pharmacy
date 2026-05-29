export const CLIENT_API_ROUTES = {
  health: '/api/health',

  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    current: '/api/auth/me',
    password: '/api/auth/password',
    forgotPassword: '/api/auth/request-reset-email',
    resetPassword: '/api/auth/reset-password',
  },

  stores: {
    list: '/api/stores',
    filters: '/api/stores/filters',
    details: (storeId: string) => `/api/stores/${storeId}`,
    reviews: (storeId: string) => `/api/stores/${storeId}/reviews`,
    favorite: (storeId: string) => `/api/stores/${storeId}/favorite`,
  },

  products: {
    list: '/api/products',
    filters: '/api/products/filters',
    details: (productId: string) => `/api/products/${productId}`,
    reviews: (productId: string) => `/api/products/${productId}/reviews`,
    favorite: (productId: string) => `/api/products/${productId}/favorite`,
  },

  cart: {
    current: '/api/cart',
    addItem: '/api/cart/items',
    updateItem: (cartItemId: string) => `/api/cart/items/${cartItemId}`,
    removeItem: (cartItemId: string) => `/api/cart/items/${cartItemId}`,
    clear: '/api/cart/clear',
  },

  orders: {
    checkout: '/api/orders/checkout',
    list: '/api/orders',
    details: (orderId: string) => `/api/orders/${orderId}`,
  },
} as const;
