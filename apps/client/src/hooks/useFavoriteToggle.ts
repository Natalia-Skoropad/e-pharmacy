'use client';

import { useState } from 'react';

import { useAuth } from '@/providers';

//===================================================================

type FavoriteResponse = {
  isFavorite: boolean;
};

type FavoriteNotifier = {
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

type UseFavoriteToggleParams<TId extends string> = {
  id: TId;
  initialIsFavorite?: boolean;
  notifier: FavoriteNotifier;
  loginMessage: string;
  addedMessage: string;
  removedMessage: string;
  errorMessage: string;
  toggleFavorite: (id: TId) => Promise<FavoriteResponse>;
  onFavoriteChange?: (id: TId, isFavorite: boolean) => void;
};

//===================================================================

export function useFavoriteToggle<TId extends string>({
  id,
  initialIsFavorite = false,
  notifier,
  loginMessage,
  addedMessage,
  removedMessage,
  errorMessage,
  toggleFavorite,
  onFavoriteChange,
}: UseFavoriteToggleParams<TId>) {
  const { sessionMarker, isAuthenticated, isAuthReady } = useAuth();

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !sessionMarker) {
      notifier.info(loginMessage);
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const response = await toggleFavorite(id);

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
