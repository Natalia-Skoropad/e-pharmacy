export type FavoriteToggleLock = { current: boolean };

//===================================================================

export type FavoriteToggleLifecycleOptions = Readonly<{
  lock: FavoriteToggleLock;
  disabled: boolean;
  pending: boolean;
  setLocalPending: (pending: boolean) => void;
  onToggle: () => void | Promise<void>;
}>;

//===================================================================

export async function runFavoriteToggleLifecycle({
  lock,
  disabled,
  pending,
  setLocalPending,
  onToggle,
}: FavoriteToggleLifecycleOptions): Promise<boolean> {
  if (disabled || pending || lock.current) return false;

  lock.current = true;
  setLocalPending(true);

  try {
    await onToggle();
  } finally {
    lock.current = false;
    setLocalPending(false);
  }

  return true;
}
