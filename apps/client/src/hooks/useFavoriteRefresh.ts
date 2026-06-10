'use client';

import { useEffect } from 'react';

//===================================================================

type UseFavoriteRefreshParams = {
  isEnabled: boolean;
  refreshFavorite: () => Promise<boolean>;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useFavoriteRefresh({
  isEnabled,
  refreshFavorite,
  onRefresh,
}: UseFavoriteRefreshParams): void {
  useEffect(() => {
    if (!isEnabled) return;

    let isMounted = true;

    refreshFavorite()
      .then((isFavorite) => {
        if (isMounted) onRefresh(isFavorite);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isEnabled, onRefresh, refreshFavorite]);
}
