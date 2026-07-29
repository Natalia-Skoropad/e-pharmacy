// A cart write is authoritative only while the owning client session is alive.
// The queue serializes all writes so an older response can never overwrite a
// newer cart snapshot from another item operation.

//===================================================================

export type CartMutationTask<T> = (
  signal: AbortSignal
) => Promise<T>;

export type CartMutationQueue = Readonly<{
  enqueue: <T>(task: CartMutationTask<T>) => Promise<T | null>;
  close: (reason?: unknown) => void;
  isClosed: () => boolean;
}>;

//===================================================================

export function createCartMutationQueue(): CartMutationQueue {
  let tail: Promise<void> = Promise.resolve();
  let closed = false;
  const controllers = new Set<AbortController>();

  const enqueue = <T>(task: CartMutationTask<T>): Promise<T | null> => {
    const result = tail.then(async () => {
      if (closed) return null;

      const controller = new AbortController();
      controllers.add(controller);

      try {
        return await task(controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return null;
        throw error;
      } finally {
        controllers.delete(controller);
      }
    });

    tail = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  };

  const close = (reason?: unknown): void => {
    if (closed) return;

    closed = true;
    for (const controller of controllers) controller.abort(reason);
    controllers.clear();
  };

  return {
    enqueue,
    close,
    isClosed: () => closed,
  };
}
