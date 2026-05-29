import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';

//===================================================================

const AUTH_STATUS_MESSAGES = {
  400: 'Please check the entered data and try again.',
  401: 'Email or password is invalid.',
  404: 'Service is temporarily unavailable. Please try again later.',
  409: 'An account with this email already exists.',
  500: 'Authentication service is temporarily unavailable. Please try again later.',
} as const;

//===================================================================

export function getAuthErrorMessage(error: unknown): string {
  return getAppErrorMessage(error, {
    fallback: APP_ERROR_MESSAGES.auth.login,
    statusMessages: AUTH_STATUS_MESSAGES,
    preferApiMessage: false,
  });
}
