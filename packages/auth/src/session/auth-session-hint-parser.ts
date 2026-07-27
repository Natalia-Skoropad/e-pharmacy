function decodeCookieValueSafely(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

//===================================================================

export function hasExactCookieValue(
  cookieHeader: string,
  name: string,
  expectedValue: string
): boolean {
  const prefix = `${name}=`;

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.startsWith(prefix))
    .map((item) => item.slice(prefix.length))
    .map(decodeCookieValueSafely)
    .some((value) => value === expectedValue);
}
