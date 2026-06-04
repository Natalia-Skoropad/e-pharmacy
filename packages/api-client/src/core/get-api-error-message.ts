type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
};

//===================================================================

export function getApiErrorMessage(
  payload: unknown,
  fallback = 'Request failed'
): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as ApiErrorPayload;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.filter(Boolean).join(', ');
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return fallback;
}
