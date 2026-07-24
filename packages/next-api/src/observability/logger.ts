import { redactRequestPath } from './redaction';

//===================================================================

export type TransportAuthMode = 'public' | 'optional' | 'private' | 'auth';

//===================================================================

export type TransportLogEntry = Readonly<{
  requestId: string;
  method: string;
  path: string;
  destination: 'backend' | 'bff';
  durationMs: number;
  status?: number;
  retryCount?: number;
  authMode: TransportAuthMode;
  refreshPerformed?: boolean;
  cachePolicy?: string;
  transportErrorCode?: string;
  source: string;
}>;

//===================================================================

export function logTransportRequest(entry: TransportLogEntry): void {
  const payload = {
    event: 'api_transport',
    requestId: entry.requestId,
    method: entry.method,
    path: redactRequestPath(entry.path),
    destination: entry.destination,
    durationMs: Math.max(0, Math.round(entry.durationMs)),
    status: entry.status,
    retryCount: entry.retryCount ?? 0,
    authMode: entry.authMode,
    refreshPerformed: entry.refreshPerformed ?? false,
    cachePolicy: entry.cachePolicy ?? 'default',
    transportErrorCode: entry.transportErrorCode,
    source: entry.source,
  };

  if ((entry.status ?? 0) >= 500 || entry.transportErrorCode) {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
