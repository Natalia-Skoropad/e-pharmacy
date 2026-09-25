import type { AuthErrorCode } from '@e-pharmacy/auth/errors';

//===================================================================

const PHARMACY_PASSWORD_CHANGE_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Current password is incorrect.',
  email_conflict: 'This email is already in use.',
  phone_conflict: 'This phone number is already in use.',

  profile_conflict:
    'Your profile changed in another tab. Reload the latest data and try again.',

  account_blocked: 'This account is blocked. Contact support.',
  session_invalid: 'Your session has expired. Please sign in again.',
  session_revoked: 'This session is no longer active. Please sign in again.',
  invalid_reset_token: 'This password reset link is invalid or has expired.',
  rate_limited: 'Too many attempts. Please try again later.',

  forbidden_origin:
    'This request could not be completed from the current application.',

  csrf_failed: 'The security check failed. Reload the page and try again.',

  validation_error:
    'Check your current password and new password, then try again.',

  not_found: 'The requested authentication resource was not found.',

  network_error:
    'Unable to reach the server. Check your connection and try again.',

  timeout: 'The request took too long. Please try again.',
  service_unavailable: 'The authentication service is temporarily unavailable.',
  invalid_response: 'The authentication service returned an invalid response.',

  registration_session_failed:
    'Automatic sign-in could not be completed. Please sign in again.',

  server_error:
    'The server is temporarily unavailable. Please try again later.',

  unknown: 'Could not change password. Please try again.',
};

//===================================================================

export function getPharmacyPasswordChangeErrorMessage(
  code: AuthErrorCode
): string {
  return PHARMACY_PASSWORD_CHANGE_ERROR_MESSAGES[code];
}
