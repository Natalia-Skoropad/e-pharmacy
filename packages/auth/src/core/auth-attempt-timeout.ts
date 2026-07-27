import type { AuthRequestAttempt } from './auth-request-manager';

//===================================================================

export type AuthAttemptOutcome<TValue> =
  | Readonly<{ type: 'response'; response: TValue }>
  | Readonly<{ type: 'error'; error: unknown }>
  | Readonly<{ type: 'timeout' }>;

//===================================================================

export async function waitForAuthAttempt<TValue>(
  attempt: AuthRequestAttempt<TValue>,
  timeoutMs: number | undefined,
  onTimeout: () => void
): Promise<AuthAttemptOutcome<TValue>> {
  const requestOutcome = attempt.promise.then<
    AuthAttemptOutcome<TValue>,
    AuthAttemptOutcome<TValue>
  >(
    (response) => ({ type: 'response', response }),
    (error: unknown) => ({ type: 'error', error })
  );

  if (!timeoutMs) return requestOutcome;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutOutcome = new Promise<AuthAttemptOutcome<TValue>>((resolve) => {
    timeoutId = setTimeout(() => {
      onTimeout();
      resolve({ type: 'timeout' });
    }, timeoutMs);
  });

  const outcome = await Promise.race([requestOutcome, timeoutOutcome]);

  if (timeoutId !== null) clearTimeout(timeoutId);
  return outcome;
}
