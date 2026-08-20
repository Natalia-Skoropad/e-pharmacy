export const NEXT_API_TIMEOUTS_MS = {
  publicRead: 6_000,
  privateRequest: 12_000,
  authRefresh: 8_000,
  authRequest: 20_000,
  documentTransfer: 30_000,
} as const;

//===================================================================

export const PUBLIC_READ_RETRY_POLICY = {
  attempts: 2,
  statuses: [502, 503, 504] as const,
  delayMs: 150,
} as const;

//===================================================================

export const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 120;
export const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 300;

//===================================================================

export const PROXY_REQUEST_BODY_LIMITS_BYTES = {
  smallJson: 64 * 1024,
  standardJson: 1024 * 1024,
  documentUpload: 32 * 1024 * 1024,
} as const;
