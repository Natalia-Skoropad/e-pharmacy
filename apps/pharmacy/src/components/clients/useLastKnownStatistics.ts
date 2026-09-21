'use client';

import { useCallback, useState } from 'react';

//===================================================================

export type StatisticsResourceStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

export function useLastKnownStatistics<T>() {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<StatisticsResourceStatus>('idle');

  const startLoading = useCallback(() => {
    setStatus('loading');
  }, []);

  const setSuccess = useCallback((nextData: T) => {
    setData(nextData);
    setStatus('success');
  }, []);

  const setFailure = useCallback(() => {
    setStatus('error');
  }, []);

  return {
    data,
    status,
    startLoading,
    setSuccess,
    setFailure,
  } as const;
}
