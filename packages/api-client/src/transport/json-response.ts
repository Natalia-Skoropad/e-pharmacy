export type JsonParseResult =
  | Readonly<{
      success: true;
      value: unknown;
    }>
  | Readonly<{
      success: false;
      issue: 'not-json' | 'invalid-json';
    }>;

//===================================================================

const JSON_MEDIA_TYPE_PATTERN =
  /^(?:application\/json|[^;\s]+\/[^;\s]+\+json)$/i;

//===================================================================

export function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;

  const mediaType = contentType.split(';', 1)[0]?.trim() ?? '';
  return JSON_MEDIA_TYPE_PATTERN.test(mediaType);
}

//===================================================================

export async function parseJsonResponse(
  response: Response
): Promise<JsonParseResult> {
  if (!isJsonContentType(response.headers.get('content-type'))) {
    return { success: false, issue: 'not-json' };
  }

  try {
    return { success: true, value: await response.json() };
  } catch {
    return { success: false, issue: 'invalid-json' };
  }
}
