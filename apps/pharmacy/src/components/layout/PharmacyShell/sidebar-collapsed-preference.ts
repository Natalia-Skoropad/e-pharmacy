const SIDEBAR_COLLAPSED_STORAGE_KEY = 'pharmacy-sidebar-collapsed';
const SIDEBAR_COLLAPSED_CHANGE_EVENT = 'pharmacy:sidebar-collapsed-change';

//===================================================================

let sidebarCollapsedFallback = false;

//===================================================================

export function getSidebarCollapsedSnapshot(): boolean {
  try {
    const storedValue = window.localStorage.getItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY
    );

    if (storedValue === 'true' || storedValue === 'false') {
      sidebarCollapsedFallback = storedValue === 'true';
    }
  } catch {
    // Keep the in-memory value when browser storage is unavailable.
  }

  return sidebarCollapsedFallback;
}

//===================================================================

export function getServerSidebarCollapsedSnapshot(): boolean {
  return false;
}

//===================================================================

export function subscribeToSidebarCollapsed(
  onStoreChange: () => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_COLLAPSED_STORAGE_KEY) return;

    sidebarCollapsedFallback = event.newValue === 'true';
    onStoreChange();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onStoreChange);
  };
}

//===================================================================

export function updateSidebarCollapsed(nextValue: boolean): void {
  sidebarCollapsedFallback = nextValue;

  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(nextValue)
    );
  } catch {
    // The in-memory snapshot keeps the UI functional without storage.
  }

  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_CHANGE_EVENT));
}
