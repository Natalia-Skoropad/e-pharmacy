'use client';

import { useCallback } from 'react';

import {
  getFavoriteProductIds,
  getFavoritePharmacyIds,
} from '@/lib/api/browser';

import { useClientAuthCapabilities } from './useClientAuthCapabilities';
import { useFavoriteRefresh } from './useFavoriteRefresh';

//===================================================================

type UseFavoriteStatusRefreshParams = {
  id: string;
  isEnabled: boolean;
  onRefresh: (isFavorite: boolean) => void;
  onError?: (error: unknown) => void;
};

//===================================================================

export function useProductFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
  onError,
}: UseFavoriteStatusRefreshParams): void {
  const { user } = useClientAuthCapabilities();

  const refreshFavorite = useCallback(
    async (signal: AbortSignal) => {
      if (!user?.id) return false;

      const response = await getFavoriteProductIds({ signal });
      return response.ids.includes(id);
    },
    [id, user?.id]
  );

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
    onError,
  });
}

//===================================================================

export function usePharmacyFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
  onError,
}: UseFavoriteStatusRefreshParams): void {
  const { user } = useClientAuthCapabilities();

  const refreshFavorite = useCallback(
    async (signal: AbortSignal) => {
      if (!user?.id) return false;

      const response = await getFavoritePharmacyIds({ signal });
      return response.ids.includes(id);
    },
    [id, user?.id]
  );

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
    onError,
  });
}
