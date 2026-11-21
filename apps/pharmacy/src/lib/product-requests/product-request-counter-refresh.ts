const REFRESH_EVENT = 'pharmacy:product-request-counters-refresh';

//===================================================================

/** Refresh navigation counters after a successful owner request mutation. */
export function dispatchProductRequestCounterRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(REFRESH_EVENT));
  }
}

//===================================================================

export function subscribeToProductRequestCounterRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(REFRESH_EVENT, listener);

  return () => window.removeEventListener(REFRESH_EVENT, listener);
}
