const PHARMACY_OWNER_NAVIGATION_BADGE_REFRESH_EVENT =
  'admin:pharmacy-owner-navigation-badge-refresh';

//===================================================================

export function requestPharmacyOwnerNavigationBadgeRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new Event(PHARMACY_OWNER_NAVIGATION_BADGE_REFRESH_EVENT)
  );
}

//===================================================================

export function subscribeToPharmacyOwnerNavigationBadgeRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(
    PHARMACY_OWNER_NAVIGATION_BADGE_REFRESH_EVENT,
    listener
  );

  return () => {
    window.removeEventListener(
      PHARMACY_OWNER_NAVIGATION_BADGE_REFRESH_EVENT,
      listener
    );
  };
}
