'use client';

import { useEffect, useState } from 'react';

//===================================================================

export function useDebouncedValue<TValue>(
  value: TValue,
  delayMs: number
): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new RangeError(
        'Debounce delay must be a finite non-negative number.'
      );
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
