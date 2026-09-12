export type PharmacyLogoutLifecycleLock = { current: boolean };

//===================================================================

export type PharmacyLogoutLifecycleOptions = Readonly<{
  lock: PharmacyLogoutLifecycleLock;
  logout: () => Promise<void>;
  setPending: (pending: boolean) => void;
  onSettled?: () => void;
  navigateToLogin: () => void;
}>;

//===================================================================

export async function runPharmacyLogoutLifecycle({
  lock,
  logout,
  setPending,
  onSettled,
  navigateToLogin,
}: PharmacyLogoutLifecycleOptions): Promise<boolean> {
  if (lock.current) return false;

  lock.current = true;
  setPending(true);

  try {
    await logout();
  } catch {
    // Shared auth clears local identity before the remote request. A transport
    // failure must not strand the user inside the private cabinet UI.
  } finally {
    try {
      onSettled?.();
    } finally {
      try {
        navigateToLogin();
      } finally {
        lock.current = false;
        setPending(false);
      }
    }
  }

  return true;
}
