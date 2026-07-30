'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  useFavorites,
  type FavoriteEntityType,
} from '@/providers/FavoritesProvider';

import { useClientSessionScope } from '@/providers/AuthProvider';

import { useClientAuthCapabilities } from './useClientAuthCapabilities';

//===================================================================

type FavoriteNotifier = Readonly<{
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}>;

type UseFavoriteActionsParams = Readonly<{
  entityType: FavoriteEntityType;
  id: string;
  notifier: FavoriteNotifier;
  loginMessage: string;
  unavailableMessage: string;
  clientAccountRequiredMessage: string;
  addedMessage: string;
  removedMessage: string;
  errorMessage: string;
  onFavoriteChange?: (id: string, isFavorite: boolean) => void;
}>;

export type FavoriteActions = Readonly<{
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  toggleFavorite: () => Promise<void>;
}>;

//===================================================================

export function useFavoriteActions({
  entityType,
  id,
  notifier,
  loginMessage,
  unavailableMessage,
  clientAccountRequiredMessage,
  addedMessage,
  removedMessage,
  errorMessage,
  onFavoriteChange,
}: UseFavoriteActionsParams): FavoriteActions {
  const {
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    canUseClientFeatures,
  } = useClientAuthCapabilities();
  const { ownerKey } = useClientSessionScope();

  const {
    getCollectionStatus,
    isFavorite: readIsFavorite,
    isPending,
    loadCollection,
    toggleFavorite: toggleFavoriteInStore,
  } = useFavorites();

  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;

    return () => {
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, [entityType, id, ownerKey]);

  useEffect(() => {
    if (!canUseClientFeatures) return;

    void loadCollection(entityType).catch(() => undefined);
  }, [canUseClientFeatures, entityType, loadCollection]);

  const isFavorite = readIsFavorite(entityType, id);

  const isFavoriteLoading =
    isPending(entityType, id) || getCollectionStatus(entityType) === 'loading';

  const toggleFavorite = useCallback(async (): Promise<void> => {
    if (isBootstrapping) return;

    if (isUnavailable) {
      notifier.error(unavailableMessage);
      return;
    }

    if (!isAuthenticated) {
      notifier.info(loginMessage);
      return;
    }

    if (!canUseClientFeatures) {
      notifier.info(clientAccountRequiredMessage);
      return;
    }

    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;

    try {
      const result = await toggleFavoriteInStore(entityType, id, {
        signal: controller.signal,
      });
      if (!result) return;

      onFavoriteChange?.(id, result.isFavorite);
      notifier.success(result.isFavorite ? addedMessage : removedMessage);
    } catch {
      if (!controller.signal.aborted) notifier.error(errorMessage);
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  }, [
    addedMessage,
    canUseClientFeatures,
    clientAccountRequiredMessage,
    entityType,
    errorMessage,
    id,
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    loginMessage,
    notifier,
    onFavoriteChange,
    removedMessage,
    toggleFavoriteInStore,
    unavailableMessage,
  ]);

  return {
    isFavorite,
    isFavoriteLoading,
    toggleFavorite,
  };
}
