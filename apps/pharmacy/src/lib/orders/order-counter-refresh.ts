const ORDER_COUNTER_REFRESH_EVENT = 'pharmacy:order-counters-refresh';

//===================================================================

export function dispatchOrderCounterRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ORDER_COUNTER_REFRESH_EVENT));
}

//===================================================================

export function subscribeToOrderCounterRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(ORDER_COUNTER_REFRESH_EVENT, listener);

  return () => {
    window.removeEventListener(ORDER_COUNTER_REFRESH_EVENT, listener);
  };
}
