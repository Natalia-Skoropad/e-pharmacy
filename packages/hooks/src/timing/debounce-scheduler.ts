export type DebounceTimerApi = Readonly<{
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (timeoutId: number) => void;
}>;

//===================================================================

export function assertValidDebounceDelay(delayMs: number): void {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new RangeError(
      'Debounce delay must be a finite non-negative number.'
    );
  }
}

//===================================================================

export function scheduleDebouncedValue<TValue>({
  value,
  delayMs,
  commit,
  timers,
}: Readonly<{
  value: TValue;
  delayMs: number;
  commit: (value: TValue) => void;
  timers: DebounceTimerApi;
}>): () => void {
  assertValidDebounceDelay(delayMs);

  const timeoutId = timers.setTimeout(() => {
    commit(value);
  }, delayMs);

  return () => {
    timers.clearTimeout(timeoutId);
  };
}
