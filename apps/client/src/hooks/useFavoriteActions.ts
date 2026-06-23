'use client';

import { useState } from 'react';

import { useAuth } from '@e-pharmacy/auth/core';

//===================================================================

type FavoriteResponse = {
  isFavorite: boolean;
};

type FavoriteNotifier = {
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

type UseFavoriteActionsParams<TId extends string> = {
  id: TId;
  initialIsFavorite?: boolean;
  notifier: FavoriteNotifier;
  loginMessage: string;
  addedMessage: string;
  removedMessage: string;
  errorMessage: string;
  addFavorite: (id: TId) => Promise<FavoriteResponse>;
  removeFavorite: (id: TId) => Promise<FavoriteResponse>;
  onFavoriteChange?: (id: TId, isFavorite: boolean) => void;
};

//===================================================================

export function useFavoriteActions<TId extends string>({
  id,
  initialIsFavorite = false,
  notifier,
  loginMessage,
  addedMessage,
  removedMessage,
  errorMessage,
  addFavorite,
  removeFavorite,
  onFavoriteChange,
}: UseFavoriteActionsParams<TId>) {
  const { isAuthenticated, isAuthReady } = useAuth();

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isAuthReady || !isAuthenticated) {
      notifier.info(loginMessage);
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const response = isFavorite
        ? await removeFavorite(id)
        : await addFavorite(id);

      setIsFavorite(response.isFavorite);
      onFavoriteChange?.(id, response.isFavorite);
      notifier.success(response.isFavorite ? addedMessage : removedMessage);
    } catch {
      notifier.error(errorMessage);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return {
    isAuthReady,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  };
}
