'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  addFavoritePharmacy,
  addFavoriteProduct,
  getFavoritePharmacyIds,
  getFavoriteProductIds,
  removeFavoritePharmacy,
  removeFavoriteProduct,
} from '@/lib/api/browser';

import { isAbortError } from '@/lib/async/is-abort-error';
import { useClientAuthCapabilities } from '@/hooks/useClientAuthCapabilities';
import { useClientSessionScope } from '@/providers/AuthProvider';

import {
  createFavoriteCollectionRequestRegistry,
  type FavoriteCollectionRequestRegistry,
} from './favorite-collection-request-registry';

//===================================================================

export type FavoriteEntityType = 'product' | 'pharmacy';

//===================================================================

type FavoriteCollectionStatus = 'idle' | 'loading' | 'ready' | 'error';

//===================================================================

type FavoriteCollectionState = Readonly<{
  ids: ReadonlySet<string>;
  status: FavoriteCollectionStatus;
  error: unknown | null;
}>;

type FavoritesState = Readonly<{
  scope: string;
  product: FavoriteCollectionState;
  pharmacy: FavoriteCollectionState;
  pendingKeys: ReadonlySet<string>;
}>;

type ActiveMutation = Readonly<{
  scope: string;
  generation: number;
  controller: AbortController;
}>;

export type FavoriteToggleResult = Readonly<{
  isFavorite: boolean;
}>;

//===================================================================

export type FavoritesContextValue = Readonly<{
  isAuthUnavailable: boolean;
  getCollectionStatus: (
    entityType: FavoriteEntityType
  ) => FavoriteCollectionStatus;
  isFavorite: (entityType: FavoriteEntityType, id: string) => boolean;
  isPending: (entityType: FavoriteEntityType, id: string) => boolean;
  loadCollection: (
    entityType: FavoriteEntityType
  ) => Promise<ReadonlySet<string> | null>;
  toggleFavorite: (
    entityType: FavoriteEntityType,
    id: string,
    options?: Readonly<{ signal?: AbortSignal }>
  ) => Promise<FavoriteToggleResult | null>;
}>;

//===================================================================

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

//===================================================================

function createEmptyCollection(): FavoriteCollectionState {
  return {
    ids: EMPTY_IDS,
    status: 'idle',
    error: null,
  };
}

//===================================================================

function createFavoritesState(scope: string): FavoritesState {
  return {
    scope,
    product: createEmptyCollection(),
    pharmacy: createEmptyCollection(),
    pendingKeys: new Set<string>(),
  };
}

//===================================================================

function getMutationKey(entityType: FavoriteEntityType, id: string): string {
  return `${entityType}:${id}`;
}

//===================================================================

function addSetValue(current: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(current);
  next.add(value);
  return next;
}

//===================================================================

function removeSetValue(
  current: ReadonlySet<string>,
  value: string
): Set<string> {
  const next = new Set(current);
  next.delete(value);
  return next;
}

//===================================================================

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

//===================================================================

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, canUseClientFeatures, isUnavailable } =
    useClientAuthCapabilities();
  const { ownerKey: authScope, generation } = useClientSessionScope();
  const ownerId = canUseClientFeatures ? (user?.id ?? null) : null;

  const lifecycleRef = useRef({ scope: authScope, generation });

  const [state, setState] = useState<FavoritesState>(() =>
    createFavoritesState(authScope)
  );

  const stateRef = useRef(state);
  const collectionRequests = useMemo<FavoriteCollectionRequestRegistry>(
    () => createFavoriteCollectionRequestRegistry(),
    []
  );

  const activeMutationsRef = useRef(new Map<string, ActiveMutation>());

  const updateState = useCallback(
    (
      scope: string,
      updater: (current: FavoritesState) => FavoritesState
    ): void => {
      if (lifecycleRef.current.scope !== scope) return;

      setState((current) => {
        const scopedCurrent =
          current.scope === scope ? current : createFavoritesState(scope);
        const next = updater(scopedCurrent);
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(
    () => () => {
      lifecycleRef.current = {
        scope: lifecycleRef.current.scope,
        generation: lifecycleRef.current.generation + 1,
      };

      collectionRequests.abortAll(
        new DOMException('Favorite session ended.', 'AbortError')
      );

      for (const mutation of activeMutationsRef.current.values()) {
        mutation.controller.abort();
      }

      activeMutationsRef.current.clear();
    },
    [collectionRequests]
  );

  const loadCollection = useCallback(
    async (
      entityType: FavoriteEntityType
    ): Promise<ReadonlySet<string> | null> => {
      const scope = authScope;
      const generation = lifecycleRef.current.generation;

      if (!ownerId || lifecycleRef.current.scope !== scope) return null;

      const currentState =
        stateRef.current.scope === scope
          ? stateRef.current
          : createFavoritesState(scope);
      const currentCollection = currentState[entityType];

      if (currentCollection.status === 'ready') {
        return currentCollection.ids;
      }

      const activeRequest = collectionRequests.get<ReadonlySet<string> | null>(
        entityType,
        scope
      );
      if (activeRequest) return activeRequest;

      updateState(scope, (current) => ({
        ...current,
        [entityType]: {
          ...current[entityType],
          status: 'loading',
          error: null,
        },
      }));

      return collectionRequests.load(entityType, scope, async (signal) => {
        try {
          const response = await (entityType === 'product'
            ? getFavoriteProductIds({ signal })
            : getFavoritePharmacyIds({ signal }));

          if (
            signal.aborted ||
            lifecycleRef.current.scope !== scope ||
            lifecycleRef.current.generation !== generation
          ) {
            return null;
          }

          const ids = new Set(response.ids);

          updateState(scope, (current) => ({
            ...current,
            [entityType]: {
              ids,
              status: 'ready',
              error: null,
            },
          }));

          return ids;
        } catch (error) {
          if (
            signal.aborted ||
            isAbortError(error) ||
            lifecycleRef.current.scope !== scope ||
            lifecycleRef.current.generation !== generation
          ) {
            return null;
          }

          updateState(scope, (current) => ({
            ...current,
            [entityType]: {
              ...current[entityType],
              status: 'error',
              error,
            },
          }));

          throw error;
        }
      });
    },
    [authScope, collectionRequests, ownerId, updateState]
  );

  const toggleFavorite = useCallback(
    async (
      entityType: FavoriteEntityType,
      id: string,
      options: Readonly<{ signal?: AbortSignal }> = {}
    ): Promise<FavoriteToggleResult | null> => {
      const scope = authScope;
      const generation = lifecycleRef.current.generation;

      if (!ownerId || lifecycleRef.current.scope !== scope) return null;

      const mutationKey = getMutationKey(entityType, id);
      if (activeMutationsRef.current.has(mutationKey)) return null;

      const loadedIds = await loadCollection(entityType);

      if (
        !loadedIds ||
        lifecycleRef.current.scope !== scope ||
        lifecycleRef.current.generation !== generation
      ) {
        return null;
      }

      if (options.signal?.aborted) return null;

      const controller = new AbortController();
      const abortFromCaller = () => controller.abort(options.signal?.reason);
      options.signal?.addEventListener('abort', abortFromCaller, {
        once: true,
      });

      const mutation: ActiveMutation = {
        scope,
        generation,
        controller,
      };

      activeMutationsRef.current.set(mutationKey, mutation);

      updateState(scope, (current) => ({
        ...current,
        pendingKeys: addSetValue(current.pendingKeys, mutationKey),
      }));

      const wasFavorite = loadedIds.has(id);

      try {
        const response = await (entityType === 'product'
          ? wasFavorite
            ? removeFavoriteProduct(id, { signal: controller.signal })
            : addFavoriteProduct(id, { signal: controller.signal })
          : wasFavorite
            ? removeFavoritePharmacy(id, { signal: controller.signal })
            : addFavoritePharmacy(id, { signal: controller.signal }));

        if (
          controller.signal.aborted ||
          lifecycleRef.current.scope !== scope ||
          lifecycleRef.current.generation !== generation
        ) {
          return null;
        }

        updateState(scope, (current) => {
          const collection = current[entityType];
          const ids = response.isFavorite
            ? addSetValue(collection.ids, id)
            : removeSetValue(collection.ids, id);

          return {
            ...current,
            [entityType]: {
              ids,
              status: 'ready',
              error: null,
            },
          };
        });

        return { isFavorite: response.isFavorite };
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return null;
        throw error;
      } finally {
        options.signal?.removeEventListener('abort', abortFromCaller);
        const activeMutation = activeMutationsRef.current.get(mutationKey);

        if (activeMutation === mutation) {
          activeMutationsRef.current.delete(mutationKey);

          updateState(scope, (current) => ({
            ...current,
            pendingKeys: removeSetValue(current.pendingKeys, mutationKey),
          }));
        }
      }
    },
    [authScope, loadCollection, ownerId, updateState]
  );

  const visibleState =
    state.scope === authScope ? state : createFavoritesState(authScope);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isAuthUnavailable: isUnavailable,
      getCollectionStatus: (entityType) => visibleState[entityType].status,
      isFavorite: (entityType, id) => {
        if (!canUseClientFeatures) return false;

        const collection = visibleState[entityType];
        return collection.status === 'ready' && collection.ids.has(id);
      },
      isPending: (entityType, id) =>
        visibleState.pendingKeys.has(getMutationKey(entityType, id)),
      loadCollection,
      toggleFavorite,
    }),
    [
      canUseClientFeatures,
      isUnavailable,
      loadCollection,
      toggleFavorite,
      visibleState,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

//===================================================================

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider.');
  }

  return context;
}
