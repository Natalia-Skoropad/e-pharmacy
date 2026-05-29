'use client';

import { useCallback } from 'react';

import { useFavoriteRefresh } from './useFavoriteRefresh';
import { getProductDetails, getStoreDetails } from '@/services';

//===================================================================

type UseFavoriteStatusRefreshParams = {
  id: string;
  isEnabled: boolean;
  sessionMarker: string | null;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useProductFavoriteRefresh({
  id,
  isEnabled,
  sessionMarker,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const response = await getProductDetails(id);

    return Boolean(response.product.isFavorite);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    sessionMarker,
    refreshFavorite,
    onRefresh,
  });
}

export function useStoreFavoriteRefresh({
  id,
  isEnabled,
  sessionMarker,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const response = await getStoreDetails(id);

    return Boolean(response.store.isFavorite);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    sessionMarker,
    refreshFavorite,
    onRefresh,
  });
}
