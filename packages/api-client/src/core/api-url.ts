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
const PRODUCTION_API_BASE_URL = 'https://e-pharmacy-api-pbaz.onrender.com';

//===================================================================

function getDefaultApiBaseUrl(): string {
  const env = typeof process !== 'undefined' ? process?.env : undefined;

  if (env?.NEXT_PUBLIC_API_BASE_URL) {
    return env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (env?.API_BASE_URL) {
    return env.API_BASE_URL;
  }

  return env?.NODE_ENV === 'production'
    ? PRODUCTION_API_BASE_URL
    : LOCAL_API_BASE_URL;
}

//===================================================================

export function createApiUrl(
  path: string,
  baseUrl = getDefaultApiBaseUrl()
): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, baseUrl).toString();
}
