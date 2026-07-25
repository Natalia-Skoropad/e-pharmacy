'use client';

import { useEffect } from 'react';

//===================================================================

type UseFavoriteRefreshParams = {
  isEnabled: boolean;
  refreshFavorite: (signal: AbortSignal) => Promise<boolean>;
  onRefresh: (isFavorite: boolean) => void;
  onError?: (error: unknown) => void;
};

//===================================================================

export function useFavoriteRefresh({
  isEnabled,
  refreshFavorite,
  onRefresh,
  onError,
}: UseFavoriteRefreshParams): void {
  useEffect(() => {
    if (!isEnabled) return;

    const controller = new AbortController();

    refreshFavorite(controller.signal)
      .then((isFavorite) => {
        if (!controller.signal.aborted) onRefresh(isFavorite);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) onError?.(error);
      });

    return () => {
      controller.abort();
    };
  }, [isEnabled, onError, onRefresh, refreshFavorite]);
}
