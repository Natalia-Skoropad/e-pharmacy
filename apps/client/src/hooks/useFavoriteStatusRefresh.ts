'use client';

import { useCallback } from 'react';

import { getProductDetails, getStoreDetails } from '@/services';

import { useFavoriteRefresh } from './useFavoriteRefresh';

//===================================================================

type UseFavoriteStatusRefreshParams = {
  id: string;
  isEnabled: boolean;
  token: string | null;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

export function useProductFavoriteRefresh({
  id,
  isEnabled,
  token,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(
    async (currentToken: string) => {
      const response = await getProductDetails(id, currentToken);

      return Boolean(response.product.isFavorite);
    },
    [id]
  );

  useFavoriteRefresh({
    isEnabled,
    token,
    refreshFavorite,
    onRefresh,
  });
}

export function useStoreFavoriteRefresh({
  id,
  isEnabled,
  token,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(
    async (currentToken: string) => {
      const response = await getStoreDetails(id, currentToken);

      return Boolean(response.store.isFavorite);
    },
    [id]
  );

  useFavoriteRefresh({
    isEnabled,
    token,
    refreshFavorite,
    onRefresh,
  });
}
