import { tryParseApiErrorEnvelope } from '../response/api-envelope';

//===================================================================

type LegacyApiErrorPayload = {
  message?: unknown;
  error?: unknown;
};

//===================================================================

function getStringArrayMessage(value: unknown): string | null {
  if (!Array.isArray(value)) return null;

  const messages = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(', ') : null;
}

//===================================================================

export function getApiErrorMessage(
  payload: unknown,
  fallback = 'Request failed'
): string {
  const canonical = tryParseApiErrorEnvelope(payload);
  if (canonical) return canonical.message;

  if (!payload || typeof payload !== 'object') return fallback;

  const data = payload as LegacyApiErrorPayload;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  const arrayMessage = getStringArrayMessage(data.message);
  if (arrayMessage) return arrayMessage;

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  return fallback;
}
