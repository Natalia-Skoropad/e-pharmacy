'use client';

import { useCallback } from 'react';
import { useFavoriteRefresh } from './useFavoriteRefresh';

import {
  getProductDetails,
  getStoreDetails,
} from '@e-pharmacy/api-client/client';

//===================================================================

type UseFavoriteStatusRefreshParams = {
  id: string;
  isEnabled: boolean;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useProductFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const response = await getProductDetails(id);

    return Boolean(response.product.isFavorite);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
  });
}

//===================================================================

export function useStoreFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const response = await getStoreDetails(id);

    return Boolean(response.store.isFavorite);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
  });
}
