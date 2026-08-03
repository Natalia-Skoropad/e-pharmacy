export type CatalogSearchScheduler<TValue> = Readonly<{
  schedule: (
    value: TValue,
    delay: number,
    commit: (value: TValue) => void
  ) => void;
  cancel: () => void;
}>;

//===================================================================

export function hasCommittedCatalogSearchChanged(
  previousCommittedKey: string,
  nextCommittedKey: string
): boolean {
  return previousCommittedKey !== nextCommittedKey;
}

//===================================================================

export function createCatalogSearchScheduler<
  TValue,
>(): CatalogSearchScheduler<TValue> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId === null) return;
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return {
    schedule(value, delay, commit) {
      cancel();
      timeoutId = setTimeout(() => {
        timeoutId = null;
        commit(value);
      }, delay);
    },
    cancel,
  };
}
