'use client';

import { useEffect } from 'react';

//===================================================================

type UseFavoriteRefreshParams = {
  isEnabled: boolean;
  token: string | null;
  refreshFavorite: (token: string) => Promise<boolean>;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useFavoriteRefresh({
  isEnabled,
  token,
  refreshFavorite,
  onRefresh,
}: UseFavoriteRefreshParams): void {
  useEffect(() => {
    if (!isEnabled || !token) return;

    let isMounted = true;

    refreshFavorite(token)
      .then((isFavorite) => {
        if (isMounted) onRefresh(isFavorite);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isEnabled, onRefresh, refreshFavorite, token]);
}
