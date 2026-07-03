type RequestDestination = 'backend' | 'bff';

type ApiRequestLogEntry = {
  method: string;
  path: string;
  destination: RequestDestination;
  durationMs: number;
  status?: number;
  cache?: RequestCache | string;
  source: string;
};

//===================================================================

const isDevelopment = process.env.NODE_ENV !== 'production';

//===================================================================

export function logApiRequest({
  method,
  path,
  destination,
  durationMs,
  status,
  cache,
  source,
}: ApiRequestLogEntry): void {
  if (!isDevelopment) return;

  const statusLabel = status === undefined ? 'n/a' : String(status);
  const cacheLabel = cache || 'default';

  console.info(
    `[api] ${method} ${path} -> ${destination} status=${statusLabel} duration=${Math.round(
      durationMs
    )}ms cache=${cacheLabel} source=${source}`
  );
}
