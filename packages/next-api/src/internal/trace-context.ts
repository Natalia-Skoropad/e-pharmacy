import { REQUEST_ID_HEADER_NAME } from './bff-contract';

//===================================================================

const UUID_HEX_PATTERN = /^[0-9a-f]{32}$/i;

//===================================================================

function toTraceId(requestId: string): string | null {
  const traceId = requestId.replaceAll('-', '').toLowerCase();

  if (!UUID_HEX_PATTERN.test(traceId) || /^0{32}$/.test(traceId)) return null;
  return traceId;
}

//===================================================================

export function createTraceparent(requestId: string): string | null {
  const traceId = toTraceId(requestId);
  if (!traceId) return null;

  let spanId = crypto
    .randomUUID()
    .replaceAll('-', '')
    .slice(0, 16)
    .toLowerCase();
  if (/^0{16}$/.test(spanId)) spanId = '0000000000000001';

  return `00-${traceId}-${spanId}-01`;
}

//===================================================================

export function applyServerCorrelationHeaders(
  headers: Headers,
  requestId: string,
  cacheable: boolean
): void {
  if (!cacheable) {
    headers.set(REQUEST_ID_HEADER_NAME, requestId);
    return;
  }

  headers.delete(REQUEST_ID_HEADER_NAME);
  const traceparent = createTraceparent(requestId);
  if (traceparent) headers.set('traceparent', traceparent);
}
