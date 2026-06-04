export async function parseJsonSafe<TData = unknown>(
  response: Response
): Promise<TData | null> {
  const contentType = response.headers.get('content-type');
  const hasJsonContent = contentType?.includes('application/json');

  if (!hasJsonContent) {
    return null;
  }

  try {
    return (await response.json()) as TData;
  } catch {
    return null;
  }
}
