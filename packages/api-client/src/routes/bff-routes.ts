export const CLIENT_API_PREFIX = '/api';

//===================================================================

export function addApiPrefix(path: string): string {
  if (path.startsWith(`${CLIENT_API_PREFIX}/`) || path === CLIENT_API_PREFIX) {
    return path;
  }

  return `${CLIENT_API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}

//===================================================================

export function appendSearchParams(path: string, search?: string): string {
  if (!search) return path;

  return `${path}${search.startsWith('?') ? search : `?${search}`}`;
}

//===================================================================

export function createBffRoutePair(backendPath: string) {
  return {
    backendPath,
    clientPath: addApiPrefix(backendPath),
  } as const;
}

//===================================================================

export function createClientApiPath(path: string): string {
  return addApiPrefix(path);
}
