export function createApiUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  if (!baseUrl?.trim()) {
    throw new Error('API base URL is not configured. Pass baseUrl explicitly.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}
