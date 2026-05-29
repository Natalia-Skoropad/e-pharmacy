export const API_ROUTES = {
  health: '/health',

  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    current: '/auth/current',
    password: '/auth/current/password',
    forgotPassword: '/auth/request-reset-email',
    resetPassword: '/auth/reset-password',
  },

  stores: {
    list: '/stores',
    filters: '/stores/filters',
    details: (storeId: string) => `/stores/${storeId}`,
    reviews: (storeId: string) => `/stores/${storeId}/reviews`,
    favorite: (storeId: string) => `/stores/${storeId}/favorite`,
  },

  products: {
    list: '/products',
    filters: '/products/filters',
    details: (productId: string) => `/products/${productId}`,
    reviews: (productId: string) => `/products/${productId}/reviews`,
    favorite: (productId: string) => `/products/${productId}/favorite`,
  },

  cart: {
    current: '/cart',
    addItem: '/cart/items',
    updateItem: (cartItemId: string) => `/cart/items/${cartItemId}`,
    removeItem: (cartItemId: string) => `/cart/items/${cartItemId}`,
    clear: '/cart/clear',
  },

  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
    details: (orderId: string) => `/orders/${orderId}`,
  },
} as const;
