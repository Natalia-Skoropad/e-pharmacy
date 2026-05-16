export const API_MESSAGES = {
  HEALTH_OK: 'API is healthy',

  ROUTE_NOT_FOUND: 'Route not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',

  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  USER_LOGGED_OUT: 'User logged out successfully',
  PASSWORD_RESET_EMAIL_SENT: 'Password recovery instructions were sent if this email exists.',

  EMAIL_IN_USE: 'Email is already in use',
  INVALID_CREDENTIALS: 'Email or password is invalid',
  AUTH_REQUIRED: 'Authorization token is required',
  INVALID_TOKEN: 'Authorization token is invalid',
  USER_NOT_FOUND: 'User not found',
  USER_BLOCKED: 'User is blocked',

  FORBIDDEN_ROLE: 'You do not have permission to access this resource',

  STORE_NOT_FOUND: 'Store not found',
  PRODUCT_NOT_FOUND: 'Product not found',
} as const;
