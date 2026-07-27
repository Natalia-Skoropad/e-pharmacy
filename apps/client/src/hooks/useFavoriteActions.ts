'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useClientAuthCapabilities } from './useClientAuthCapabilities';

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

type FavoriteState<TId extends string> = Readonly<{
  id: TId;
  baseline: boolean;
  value: boolean;
}>;

type ActiveFavoriteMutation<TId extends string> = Readonly<{
  id: TId;
  version: number;
}>;

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
  const {
    isAuthenticated,
    isBootstrapping,
    canUseClientFeatures,
    isActivePharmacyUser,
  } = useClientAuthCapabilities();

  const [favoriteState, setFavoriteState] = useState<FavoriteState<TId>>({
    id,
    baseline: initialIsFavorite,
    value: initialIsFavorite,
  });

  const [loadingMutation, setLoadingMutation] =
    useState<ActiveFavoriteMutation<TId> | null>(null);

  const mountedRef = useRef(true);
  const mutationVersionRef = useRef(0);
  const activeMutationRef = useRef<ActiveFavoriteMutation<TId> | null>(null);

  const hasCurrentFavoriteState =
    favoriteState.id === id &&
    favoriteState.baseline === initialIsFavorite;

  const isFavorite = hasCurrentFavoriteState
    ? favoriteState.value
    : initialIsFavorite;

  const isFavoriteLoading = loadingMutation?.id === id;

  const setIsFavorite = useCallback(
    (nextValue: boolean) => {
      setFavoriteState({
        id,
        baseline: initialIsFavorite,
        value: nextValue,
      });
    },
    [id, initialIsFavorite]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      mutationVersionRef.current += 1;
      activeMutationRef.current = null;
    };
  }, []);

  const handleFavoriteClick = useCallback(async () => {
    if (isBootstrapping || !isAuthenticated) {
      notifier.info(loginMessage);
      return;
    }

    if (!canUseClientFeatures) {
      notifier.info(
        isActivePharmacyUser
          ? 'Favorites are available only for client accounts.'
          : loginMessage
      );
      return;
    }

    if (activeMutationRef.current?.id === id) return;

    const activeMutation = {
      id,
      version: mutationVersionRef.current + 1,
    } as const;

    mutationVersionRef.current = activeMutation.version;
    activeMutationRef.current = activeMutation;
    setLoadingMutation(activeMutation);

    try {
      const response = isFavorite
        ? await removeFavorite(id)
        : await addFavorite(id);

      if (
        !mountedRef.current ||
        activeMutationRef.current !== activeMutation
      ) {
        return;
      }

      setIsFavorite(response.isFavorite);
      onFavoriteChange?.(id, response.isFavorite);
      notifier.success(response.isFavorite ? addedMessage : removedMessage);
    } catch {
      if (
        mountedRef.current &&
        activeMutationRef.current === activeMutation
      ) {
        notifier.error(errorMessage);
      }
    } finally {
      if (
        mountedRef.current &&
        activeMutationRef.current === activeMutation
      ) {
        activeMutationRef.current = null;
        setLoadingMutation(null);
      }
    }
  }, [
    addFavorite,
    addedMessage,
    canUseClientFeatures,
    errorMessage,
    id,
    isBootstrapping,
    isAuthenticated,
    isFavorite,
    isActivePharmacyUser,
    loginMessage,
    notifier,
    onFavoriteChange,
    removeFavorite,
    removedMessage,
    setIsFavorite,
  ]);

  return {
    canUseFavorites: canUseClientFeatures,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  };
}
