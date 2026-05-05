export const API_MESSAGES = {
  HEALTH_OK: 'API is healthy',

  ROUTE_NOT_FOUND: 'Route not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',

  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  USER_LOGGED_OUT: 'User logged out successfully',

  EMAIL_IN_USE: 'Email is already in use',
  INVALID_CREDENTIALS: 'Email or password is invalid',
  AUTH_REQUIRED: 'Authorization token is required',
  INVALID_TOKEN: 'Authorization token is invalid',
  USER_NOT_FOUND: 'User not found',
  USER_BLOCKED: 'User is blocked',
} as const;
