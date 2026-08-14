import { createHash } from 'node:crypto';

//===============================================================

const PROGRESSIVE_DELAY_AFTER_FAILURES = 2;
const PROGRESSIVE_DELAY_STEP_MS = 250;
const PROGRESSIVE_DELAY_MAX_MS = 1_500;

//===============================================================

export function normalizeRateLimitEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

//===============================================================

export function hashRateLimitSecret(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!normalized) return null;

  return createHash('sha256').update(normalized).digest('hex');
}

//===============================================================

export function getProgressiveDelayMs(failures: number): number {
  if (failures <= PROGRESSIVE_DELAY_AFTER_FAILURES) return 0;

  return Math.min(
    (failures - PROGRESSIVE_DELAY_AFTER_FAILURES) * PROGRESSIVE_DELAY_STEP_MS,
    PROGRESSIVE_DELAY_MAX_MS
  );
}

//===============================================================

export function fingerprintRateLimitKey(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;

  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
