export type LogoutLifecycleLock = { current: boolean };

//===================================================================

export type PublicLogoutLifecycleOptions = Readonly<{
  lock: LogoutLifecycleLock;
  logout: () => Promise<void>;
  setPending: (pending: boolean) => void;
  onSettled?: () => void;
  navigateHome: () => void;
  reportRemoteFailure: () => void;
}>;

//===================================================================

export async function runPublicLogoutLifecycle({
  lock,
  logout,
  setPending,
  onSettled,
  navigateHome,
  reportRemoteFailure,
}: PublicLogoutLifecycleOptions): Promise<boolean> {
  if (lock.current) return false;

  lock.current = true;
  setPending(true);

  try {
    await logout();
  } catch {
    try {
      reportRemoteFailure();
    } catch {
      // Reporting must never prevent local logout completion.
    }
  } finally {
    try {
      onSettled?.();
    } finally {
      navigateHome();
      lock.current = false;
      setPending(false);
    }
  }

  return true;
}
