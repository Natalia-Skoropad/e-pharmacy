'use client';

import { useEffect, useState } from 'react';

import { scheduleDebouncedValue } from './debounce-scheduler';

//===================================================================

export function useDebouncedValue<TValue>(
  value: TValue,
  delayMs: number
): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () =>
      scheduleDebouncedValue({
        value,
        delayMs,
        commit: setDebouncedValue,
        timers: {
          setTimeout: (callback, delay) => window.setTimeout(callback, delay),
          clearTimeout: (timeoutId) => window.clearTimeout(timeoutId),
        },
      }),
    [delayMs, value]
  );

  return debouncedValue;
}
