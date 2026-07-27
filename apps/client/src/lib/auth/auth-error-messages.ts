import type { AuthErrorCode } from '@e-pharmacy/auth/errors';

//===================================================================

const CLIENT_AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Invalid email or password.',
  email_conflict: 'This email is already in use.',
  phone_conflict: 'This phone number is already in use.',
  account_blocked: 'This account is blocked. Contact support for assistance.',
  account_pending: 'This account is awaiting approval.',
  account_rejected:
    'This account could not be approved. Contact support for details.',
  session_invalid: 'Your session has expired. Please sign in again.',
  session_revoked: 'This session is no longer active. Please sign in again.',
  invalid_reset_token: 'This password reset link is invalid or has expired.',
  rate_limited: 'Too many attempts. Please try again later.',
  forbidden_origin:
    'This request could not be completed from the current application.',
  csrf_failed: 'The security check failed. Reload the page and try again.',
  validation_error: 'Please check the entered information and try again.',
  not_found: 'The requested authentication resource was not found.',
  network_error:
    'Unable to reach the server. Check your connection and try again.',
  timeout: 'The request took too long. Please try again.',
  service_unavailable:
    'The authentication service is temporarily unavailable.',
  invalid_response:
    'The authentication service returned an invalid response.',
  server_error:
    'The server is temporarily unavailable. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
};

//===================================================================

export function getClientAuthErrorMessage(code: AuthErrorCode): string {
  return CLIENT_AUTH_ERROR_MESSAGES[code];
}
