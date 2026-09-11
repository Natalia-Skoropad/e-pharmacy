const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';

//===================================================================

export type PharmacyBreadcrumbLabelEventDetail = Readonly<{
  pathname: string;
  label: string;
}>;

//===================================================================

export function dispatchPharmacyBreadcrumbLabel(label: string): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;

  const dispatch = () => {
    window.dispatchEvent(
      new CustomEvent<PharmacyBreadcrumbLabelEventDetail>(
        BREADCRUMB_LABEL_EVENT,
        {
          detail: { pathname, label },
        }
      )
    );
  };

  if (typeof window.queueMicrotask === 'function') {
    window.queueMicrotask(dispatch);
    return;
  }

  void Promise.resolve().then(dispatch);
}

//===================================================================

export function subscribeToPharmacyBreadcrumbLabels(
  listener: (detail: PharmacyBreadcrumbLabelEventDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleBreadcrumbLabel = (event: Event) => {
    const { detail } = event as CustomEvent<PharmacyBreadcrumbLabelEventDetail>;

    if (!detail?.pathname || !detail.label) return;
    listener(detail);
  };

  window.addEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);

  return () => {
    window.removeEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);
  };
}
