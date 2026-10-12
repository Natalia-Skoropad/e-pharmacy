const PHARMACY_MODERATION_REFRESH_EVENT = 'admin:pharmacy-moderation-refresh';

//===================================================================

/** Invalidate mounted pharmacy registry, owner-linked lists and summaries. */
export function requestPharmacyModerationRefresh(): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(PHARMACY_MODERATION_REFRESH_EVENT));
}

//===================================================================

export function subscribeToPharmacyModerationRefresh(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener(PHARMACY_MODERATION_REFRESH_EVENT, listener);

  return () =>
    window.removeEventListener(PHARMACY_MODERATION_REFRESH_EVENT, listener);
}
