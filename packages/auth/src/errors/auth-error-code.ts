export type AuthErrorContext =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_conflict'
  | 'phone_conflict'
  | 'account_blocked'
  | 'account_pending'
  | 'account_rejected'
  | 'invalid_reset_token'
  | 'rate_limited'
  | 'forbidden_origin'
  | 'validation_error'
  | 'not_found'
  | 'network_error'
  | 'server_error'
  | 'unknown';
