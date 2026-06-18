declare const process:
  | {
      env?: {
        API_BASE_URL?: string;
        NEXT_PUBLIC_API_BASE_URL?: string;
        NODE_ENV?: string;
      };
    }
  | undefined;

//===================================================================

const LOCAL_API_BASE_URL = 'http://localhost:4000';

//===================================================================

function getDefaultApiBaseUrl(): string {
  const env = typeof process !== 'undefined' ? process?.env : undefined;
  const configuredBaseUrl = env?.API_BASE_URL ?? env?.NEXT_PUBLIC_API_BASE_URL;

  if (configuredBaseUrl) return configuredBaseUrl;
  if (env?.NODE_ENV !== 'production') return LOCAL_API_BASE_URL;

  throw new Error(
    'API base URL is not configured. Set API_BASE_URL for server requests.'
  );
}

//===================================================================

export function createApiUrl(
  path: string,
  baseUrl = getDefaultApiBaseUrl()
): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}
