'use client';

import { useCallback } from 'react';
import { useFavoriteRefresh } from './useFavoriteRefresh';

import {
  getProductDetails,
  getPharmacyDetails,
} from '@/lib/api/browser';

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

export function usePharmacyFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const response = await getPharmacyDetails(id);

    return Boolean(response.pharmacy.isFavorite);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
  });
}
