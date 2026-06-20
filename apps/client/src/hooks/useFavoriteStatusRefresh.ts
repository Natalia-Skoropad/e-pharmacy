'use client';

import { useCallback } from 'react';
import { useFavoriteRefresh } from './useFavoriteRefresh';

import {
  getFavoriteProductIds,
  getFavoritePharmacyIds,
} from '@/lib/api/browser';

//===================================================================

type UseFavoriteStatusRefreshParams = {
  id: string;
  isEnabled: boolean;
  onRefresh: (isFavorite: boolean) => void;
};

//===================================================================

// These promise caches deduplicate favorite status refreshes inside one browser
// runtime. Invalidate them after each add/remove mutation so details pages and
// catalog cards do not reuse stale favorite ids.
let favoriteProductIdsPromise: Promise<Set<string>> | null = null;
let favoritePharmacyIdsPromise: Promise<Set<string>> | null = null;

//===================================================================

async function getCachedFavoriteProductIds(): Promise<Set<string>> {
  favoriteProductIdsPromise ??= getFavoriteProductIds().then(
    (response) => new Set(response.ids)
  );

  return favoriteProductIdsPromise;
}

//===================================================================

async function getCachedFavoritePharmacyIds(): Promise<Set<string>> {
  favoritePharmacyIdsPromise ??= getFavoritePharmacyIds().then(
    (response) => new Set(response.ids)
  );

  return favoritePharmacyIdsPromise;
}

//===================================================================

export function invalidateFavoriteProductIdsCache(): void {
  favoriteProductIdsPromise = null;
}

//===================================================================

export function invalidateFavoritePharmacyIdsCache(): void {
  favoritePharmacyIdsPromise = null;
}

//===================================================================

export function useProductFavoriteRefresh({
  id,
  isEnabled,
  onRefresh,
}: UseFavoriteStatusRefreshParams): void {
  const refreshFavorite = useCallback(async () => {
    const favoriteIds = await getCachedFavoriteProductIds();

    return favoriteIds.has(id);
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
    const favoriteIds = await getCachedFavoritePharmacyIds();

    return favoriteIds.has(id);
  }, [id]);

  useFavoriteRefresh({
    isEnabled,
    refreshFavorite,
    onRefresh,
  });
}
