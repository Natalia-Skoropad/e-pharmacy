import { isApiError } from '@e-pharmacy/api-client/transport';

//===================================================================

type SafeApiErrorMessageOptions = Readonly<{
  backendMessages?: Readonly<Record<string, string>>;
  statusMessages?: Readonly<Partial<Record<number, string>>>;
}>;

//===================================================================

export function getSafeApiErrorMessage(
  error: unknown,
  fallback: string,
  options: SafeApiErrorMessageOptions = {}
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

  if (error.transportCode === 'INVALID_REQUEST_BODY') {
    return 'The request could not be prepared. Review the entered data and try again.';
  }

  const backendMessage = error.backendCode
    ? options.backendMessages?.[error.backendCode]
    : undefined;
  if (backendMessage) return backendMessage;

  const statusMessage = error.httpStatus
    ? options.statusMessages?.[error.httpStatus]
    : undefined;
  if (statusMessage) return statusMessage;

  if (error.httpStatus === 401) {
    return 'Your session has expired. Sign in again.';
  }
  if (error.httpStatus === 403) {
    return 'You do not have access to this action.';
  }
  if (error.httpStatus === 404) {
    return 'The requested resource is no longer available.';
  }
  if (error.httpStatus === 409) {
    return 'The request conflicts with the current data. Refresh and try again.';
  }
  if (error.httpStatus === 422 || error.httpStatus === 400) {
    return 'Some submitted data is invalid. Review it and try again.';
  }
  if (error.httpStatus === 429) {
    return 'Too many requests. Please wait and try again.';
  }
  if (error.httpStatus && error.httpStatus >= 500) {
    return 'The service is temporarily unavailable. Please try again later.';
  }

  return fallback;
}
