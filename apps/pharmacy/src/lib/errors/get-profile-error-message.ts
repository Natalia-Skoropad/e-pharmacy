import { isApiError } from '@e-pharmacy/api-client/transport';

import {
  PHARMACY_NO_PENDING_CHANGES_ERROR_CODE,
  PHARMACY_OWNER_REQUIRED_ERROR_CODE,
  PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE,
  PHARMACY_PROFILE_BLOCKED_ERROR_CODE,
  PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE,
  PHARMACY_PROFILE_LOCKED_ERROR_CODE,
  PHARMACY_PROFILE_CONFLICT_ERROR_CODE,
  PHARMACY_MODERATION_SUBMISSION_REQUIRED_ERROR_CODE,
  PHARMACY_PROFILE_MISSING_ERROR_CODE,
} from '@e-pharmacy/config/pharmacies';

//===================================================================

const PROFILE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  AUTH_PHONE_CONFLICT: 'This phone number is already used by another account.',
  AUTH_PROFILE_CONFLICT:
    'Your owner profile changed in another tab. Reload and try again.',
  [PHARMACY_PROFILE_MISSING_ERROR_CODE]:
    'Pharmacy profile is unavailable for this account.',
  [PHARMACY_PROFILE_BLOCKED_ERROR_CODE]: 'Pharmacy access is blocked.',
  [PHARMACY_PROFILE_LOCKED_ERROR_CODE]:
    'Profile fields are locked while Admin reviews the submitted pharmacy data.',
  [PHARMACY_PROFILE_CONFLICT_ERROR_CODE]:
    'The pharmacy profile changed in another tab. Reload the latest data and try again.',
  [PHARMACY_MODERATION_SUBMISSION_REQUIRED_ERROR_CODE]:
    'Submit active pharmacy changes through the moderation action.',
  [PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE]:
    'Complete all required pharmacy fields before verification.',
  [PHARMACY_NO_PENDING_CHANGES_ERROR_CODE]:
    'There are no pharmacy changes to send for moderation.',
  [PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE]:
    'This pharmacy profile is already submitted for review.',
  [PHARMACY_OWNER_REQUIRED_ERROR_CODE]:
    'Only the pharmacy owner can change verification profile data.',
};

//===================================================================

export function getProfileErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (!isApiError(error)) return fallback;

  if (error.transportCode === 'ABORTED') return '';
  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Network error. Check your connection and try again.';
  }
  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }
  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'The server returned an invalid response. Please try again later.';
  }

  if (error.backendCode && PROFILE_ERROR_MESSAGES[error.backendCode]) {
    return PROFILE_ERROR_MESSAGES[error.backendCode];
  }

  if (error.httpStatus === 401) return 'Your session has expired. Sign in again.';
  if (error.httpStatus === 403) return 'You do not have access to this action.';
  if (error.httpStatus === 429) {
    return 'Too many requests. Please wait and try again.';
  }
  if (error.httpStatus && error.httpStatus >= 500) {
    return 'The service is temporarily unavailable. Please try again later.';
  }

  return fallback;
}
