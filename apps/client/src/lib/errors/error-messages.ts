export const APP_ERROR_MESSAGES = {
  common: {
    default: 'Something went wrong. Please try again.',

    network:
      'Cannot connect to the server. Please check that the API is running.',

    unauthorized: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'Requested resource was not found.',

    conflict:
      'This action conflicts with the current data. Please refresh and try again.',

    validation: 'Please check the entered data and try again.',
    server: 'Server error. Please try again later.',
  },

  auth: {
    register:
      'Unable to create account. Please check the entered data and try again.',

    login: 'Unable to sign in. Please check your email and password.',
    logout: 'Unable to sign out. Please try again.',
    current: 'Unable to get current user.',
    password: 'Unable to update password. Please check the entered data.',
    forgotPassword: 'Unable to send reset email. Please try again.',

    resetPassword:
      'Unable to reset password. Please request a new link and try again.',
  },

  cart: {
    load: 'Could not load your cart. Please check the backend API.',
    update: 'Could not update cart item.',
    remove: 'Could not remove cart item.',
    clear: 'Could not clear cart.',
    removeOrder: 'Could not remove pharmacy order.',
    addProduct: 'Could not add this product to the order.',
  },

  checkout: {
    load: 'Could not load checkout data.',
    confirm: 'Could not confirm order.',

    staleOrder:
      'Sorry, we cannot confirm this order right now. While you were placing the order, these products were reserved by another client. Please update the cart and try again.',
  },

  products: {
    loadCart: 'Could not load cart data.',
    addToCart: 'Could not add product to the order.',
    removeFromCart: 'Could not remove product from the order.',
    loadList: 'Could not load products.',
    loadDetails: 'Could not load product details.',
  },

  pharmacies: {
    loadList: 'Could not load pharmacies.',
    loadDetails: 'Could not load pharmacy details.',
    copyEmail: 'Could not copy email.',
  },

  profile: {
    loadOrder: 'Order was not found or is not available for this account.',
    loadFavoriteProducts: 'Could not load favorite products.',
    loadFavoritePharmacies: 'Could not load favorite pharmacies.',
    updatePhoto: 'Could not update profile photo.',
    updateData: 'Could not update profile data.',
    updatePassword: 'Could not update password.',
  },
} as const;
