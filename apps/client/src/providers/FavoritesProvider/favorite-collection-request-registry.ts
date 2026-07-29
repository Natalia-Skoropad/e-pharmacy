export type FavoriteCollectionKey = 'product' | 'pharmacy';

//===================================================================

type ActiveFavoriteCollectionRequest<T> = Readonly<{
  ownerKey: string;
  controller: AbortController;
  promise: Promise<T>;
}>;

//===================================================================

export type FavoriteCollectionRequestRegistry = Readonly<{
  get: <T>(
    collection: FavoriteCollectionKey,
    ownerKey: string
  ) => Promise<T> | null;
  load: <T>(
    collection: FavoriteCollectionKey,
    ownerKey: string,
    request: (signal: AbortSignal) => Promise<T>
  ) => Promise<T>;
  abortAll: (reason?: unknown) => void;
}>;

//===================================================================

export function createFavoriteCollectionRequestRegistry(): FavoriteCollectionRequestRegistry {
  const active = new Map<
    FavoriteCollectionKey,
    ActiveFavoriteCollectionRequest<unknown>
  >();

  const get = <T>(
    collection: FavoriteCollectionKey,
    ownerKey: string
  ): Promise<T> | null => {
    const current = active.get(collection);
    return current?.ownerKey === ownerKey
      ? (current.promise as Promise<T>)
      : null;
  };

  const load = <T>(
    collection: FavoriteCollectionKey,
    ownerKey: string,
    request: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    const current = active.get(collection);

    if (current?.ownerKey === ownerKey) {
      return current.promise as Promise<T>;
    }

    current?.controller.abort(
      new DOMException('Favorite collection owner changed.', 'AbortError')
    );

    const controller = new AbortController();
    const promise = request(controller.signal).finally(() => {
      const latest = active.get(collection);
      if (latest?.controller === controller) active.delete(collection);
    });

    active.set(collection, { ownerKey, controller, promise });
    return promise;
  };

  const abortAll = (reason?: unknown): void => {
    for (const request of active.values()) {
      request.controller.abort(reason);
    }
    active.clear();
  };

  return { get, load, abortAll };
}
