export class InvalidBackendResponseError extends Error {
  constructor(message = 'The upstream service returned an invalid response.') {
    super(message);
    this.name = 'InvalidBackendResponseError';
  }
}

//===================================================================

export function isJsonContentType(contentType: string | null): boolean {
  return /(^|\/)json(?:;|$)|\+json(?:;|$)/i.test(contentType ?? '');
}

//===================================================================

export async function validateBackendJsonResponse(
  response: Response
): Promise<void> {
  if (response.status === 204 || response.status === 205) return;

  if (!isJsonContentType(response.headers.get('content-type'))) {
    throw new InvalidBackendResponseError(
      'The upstream service returned a non-JSON API response.'
    );
  }

  try {
    await response.clone().json();
  } catch {
    throw new InvalidBackendResponseError(
      'The upstream service returned malformed JSON.'
    );
  }
}
