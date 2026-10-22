import { performance } from 'node:perf_hooks';

//===============================================================

export const PASSWORD_RESET_MIN_RESPONSE_MS = 350;
export const PASSWORD_RESET_JITTER_MS = 150;

//===============================================================

type PasswordResetTimingDependencies = Readonly<{
  now?: () => number;
  random?: () => number;
  sleep?: (delayMs: number) => Promise<void>;
}>;

//===============================================================

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

//===============================================================

export function startPasswordResetResponseTiming(): number {
  return performance.now();
}

//===============================================================

export async function enforcePasswordResetResponseTiming(
  startedAtMs: number,
  dependencies: PasswordResetTimingDependencies = {}
): Promise<void> {
  const now = dependencies.now ?? (() => performance.now());
  const random = dependencies.random ?? Math.random;
  const sleep = dependencies.sleep ?? defaultSleep;

  const jitterMs = Math.floor(random() * (PASSWORD_RESET_JITTER_MS + 1));
  const targetDurationMs = PASSWORD_RESET_MIN_RESPONSE_MS + jitterMs;
  const elapsedMs = Math.max(0, now() - startedAtMs);
  const remainingMs = Math.max(0, targetDurationMs - elapsedMs);

  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}
