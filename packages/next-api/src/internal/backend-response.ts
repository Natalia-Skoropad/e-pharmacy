import { isJsonContentType } from '@e-pharmacy/api-client/transport';

//===================================================================

export class InvalidBackendResponseError extends Error {
  constructor(message = 'The upstream service returned an invalid response.') {
    super(message);
    this.name = 'InvalidBackendResponseError';
  }
}

//===================================================================

export { isJsonContentType };

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

//===================================================================

async function readBackendJson(response: Response): Promise<unknown> {
  if (!isJsonContentType(response.headers.get('content-type'))) {
    throw new InvalidBackendResponseError(
      'The upstream service returned a non-JSON API response.'
    );
  }

  try {
    return await response.clone().json();
  } catch {
    throw new InvalidBackendResponseError(
      'The upstream service returned malformed JSON.'
    );
  }
}

//===================================================================

export async function validateBackendJsonResponse(
  response: Response
): Promise<void> {
  if (response.status === 204 || response.status === 205) return;
  await readBackendJson(response);
}

//===================================================================

export async function validateBackendApiEnvelopeResponse(
  response: Response
): Promise<void> {
  if (response.status === 204 || response.status === 205) return;

  const payload = await readBackendJson(response);

  if (!isRecord(payload)) {
    throw new InvalidBackendResponseError(
      'The upstream service returned an invalid API envelope.'
    );
  }

  if (response.ok) {
    if (payload.status !== 'success') {
      throw new InvalidBackendResponseError(
        'The upstream service returned an invalid success envelope.'
      );
    }
    return;
  }

  if (
    payload.status !== 'error' ||
    typeof payload.message !== 'string' ||
    payload.message.trim().length === 0
  ) {
    throw new InvalidBackendResponseError(
      'The upstream service returned an invalid error envelope.'
    );
  }
}
