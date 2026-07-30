type CartMutationTask<T> = (signal: AbortSignal) => Promise<T>;

//===================================================================

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

      const aborted = new Promise<null>((resolve) => {
        controller.signal.addEventListener('abort', () => resolve(null), {
          once: true,
        });
      });

      const taskResult = task(controller.signal)
        .then<T | null>((value) => value)
        .catch((error) => {
          if (controller.signal.aborted) return null;
          throw error;
        });

      try {
        return await Promise.race([taskResult, aborted]);
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

  return { enqueue, close, isClosed: () => closed };
}
