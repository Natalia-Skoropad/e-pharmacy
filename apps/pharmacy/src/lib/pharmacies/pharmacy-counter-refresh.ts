const REFRESH_EVENT = 'pharmacy:owned-pharmacy-counters-refresh';

//===================================================================

export function dispatchPharmacyCounterRefresh(): void {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(REFRESH_EVENT));
}

//===================================================================

export function subscribeToPharmacyCounterRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(REFRESH_EVENT, listener);

  return () => window.removeEventListener(REFRESH_EVENT, listener);
}
