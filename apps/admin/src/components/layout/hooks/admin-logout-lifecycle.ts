export type AdminLogoutLifecycleLock = { current: boolean };

//===================================================================

export type AdminLogoutLifecycleOptions = Readonly<{
  lock: AdminLogoutLifecycleLock;
  logout: () => Promise<void>;
  setPending: (pending: boolean) => void;
  onSettled?: () => void;
  navigateToLogin: () => void;
}>;

//===================================================================

export async function runAdminLogoutLifecycle({
  lock,
  logout,
  setPending,
  onSettled,
  navigateToLogin,
}: AdminLogoutLifecycleOptions): Promise<boolean> {
  if (lock.current) return false;

  lock.current = true;
  setPending(true);

  try {
    await logout();
  } catch {
    // Shared auth clears local identity before the remote request. A transport
    // failure must not strand the user inside the private admin cabinet.
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
