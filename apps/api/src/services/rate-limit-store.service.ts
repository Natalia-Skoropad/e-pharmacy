import { createHash } from 'node:crypto';

import { RateLimitBucket } from '../models/rateLimitBucket.model';

//===============================================================

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_BUCKET_RETENTION_MS = RATE_LIMIT_WINDOW_MS;

//===============================================================

export type RateLimitWindow = Readonly<{
  id: string;
  resetAt: Date;
}>;

export type RateLimitCounter = Readonly<{
  hits: number;
  window: RateLimitWindow;
}>;

//===============================================================

function hashBucketIdentity(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

//===============================================================

export function createRateLimitWindow(
  policy: string,
  key: string,
  nowMs = Date.now()
): RateLimitWindow {
  const windowStartMs =
    Math.floor(nowMs / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const resetAtMs = windowStartMs + RATE_LIMIT_WINDOW_MS;

  return {
    // Raw e-mail, user id, reset token hash and IP values never become Mongo
    // document ids. Only a one-way hash of the policy/key/window tuple is kept.
    id: hashBucketIdentity(`${policy}\u0000${key}\u0000${windowStartMs}`),
    resetAt: new Date(resetAtMs),
  };
}

//===============================================================

function getBucketExpiresAt(window: RateLimitWindow): Date {
  return new Date(window.resetAt.getTime() + RATE_LIMIT_BUCKET_RETENTION_MS);
}

//===============================================================

function isDuplicateBucketInsert(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

//===============================================================

async function incrementWindow(window: RateLimitWindow): Promise<number> {
  try {
    const bucket = await RateLimitBucket.findOneAndUpdate(
      { _id: window.id },
      {
        $inc: { hits: 1 },
        $setOnInsert: {
          resetAt: window.resetAt,
          expiresAt: getBucketExpiresAt(window),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: false,
      }
    ).lean<{ hits: number } | null>();

    return bucket?.hits ?? 1;
  } catch (error) {
    // Two replicas may both observe a missing fixed-window row and race its
    // initial upsert. If one loses the _id insert race, retry as a normal
    // increment instead of failing the protected auth request.
    if (!isDuplicateBucketInsert(error)) throw error;

    const bucket = await RateLimitBucket.findOneAndUpdate(
      { _id: window.id },
      { $inc: { hits: 1 } },
      { new: true }
    ).lean<{ hits: number } | null>();

    if (!bucket) throw error;
    return bucket.hits;
  }
}

//===============================================================

export async function incrementRateLimitCounter(
  policy: string,
  key: string,
  nowMs = Date.now()
): Promise<RateLimitCounter> {
  const window = createRateLimitWindow(policy, key, nowMs);

  return {
    hits: await incrementWindow(window),
    window,
  };
}

//===============================================================

export async function getRateLimitCounter(
  policy: string,
  key: string,
  nowMs = Date.now()
): Promise<RateLimitCounter> {
  const window = createRateLimitWindow(policy, key, nowMs);
  const bucket = await RateLimitBucket.findById(window.id)
    .select('hits')
    .lean<{ hits: number } | null>();

  return {
    hits: bucket?.hits ?? 0,
    window,
  };
}

//===============================================================

export async function decrementRateLimitCounter(
  window: RateLimitWindow
): Promise<void> {
  await RateLimitBucket.updateOne(
    { _id: window.id, hits: { $gt: 0 } },
    { $inc: { hits: -1 } }
  );
}

//===============================================================

export async function resetRateLimitCounter(
  window: RateLimitWindow
): Promise<void> {
  await RateLimitBucket.deleteOne({ _id: window.id });
}

//===============================================================

export async function incrementRateLimitCounterInWindow(
  window: RateLimitWindow
): Promise<number> {
  return incrementWindow(window);
}
