'use client';

import { useEffect } from 'react';

//===================================================================

type UseFavoriteRefreshParams = {
  isEnabled: boolean;
  sessionMarker: string | null;
  refreshFavorite: () => Promise<boolean>;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useFavoriteRefresh({
  isEnabled,
  sessionMarker,
  refreshFavorite,
  onRefresh,
}: UseFavoriteRefreshParams): void {
  useEffect(() => {
    if (!isEnabled || !sessionMarker) return;

    let isMounted = true;

    refreshFavorite()
      .then((isFavorite) => {
        if (isMounted) onRefresh(isFavorite);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isEnabled, onRefresh, refreshFavorite, sessionMarker]);
}
