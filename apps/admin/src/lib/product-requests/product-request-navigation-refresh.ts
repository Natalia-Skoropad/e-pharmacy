const PRODUCT_REQUEST_NAVIGATION_REFRESH_EVENT =
  'admin:product-request-navigation-refresh';

//===============================================================

export function requestProductRequestNavigationRefresh(): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(PRODUCT_REQUEST_NAVIGATION_REFRESH_EVENT));
}

//===============================================================

export function subscribeToProductRequestNavigationRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(PRODUCT_REQUEST_NAVIGATION_REFRESH_EVENT, listener);

  return () =>
    window.removeEventListener(
      PRODUCT_REQUEST_NAVIGATION_REFRESH_EVENT,
      listener
    );
}
