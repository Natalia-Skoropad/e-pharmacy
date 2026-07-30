export const APP_ERROR_MESSAGES = {
  common: {
    default: 'Something went wrong. Please try again.',

    network:
      'Cannot connect to the server. Please check your connection and try again.',

    unauthorized: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'Requested resource was not found.',

    conflict:
      'This action conflicts with the current data. Please refresh and try again.',

    validation: 'Please check the entered data and try again.',
    server: 'Server error. Please try again later.',
  },

  cart: {
    update: 'Could not update cart item.',
    remove: 'Could not remove cart item.',
    clear: 'Could not clear cart.',
    removeOrder: 'Could not remove pharmacy order.',
  },

  checkout: {
    confirm: 'Could not confirm order.',

    staleOrder:
      'Sorry, we cannot confirm this order right now. While you were placing the order, these products were reserved by another client. Please update the cart and try again.',
  },

  products: {
    loadCart: 'Could not load cart data.',
    addToCart: 'Could not add product to the order.',
    removeFromCart: 'Could not remove product from the order.',
  },
} as const;
