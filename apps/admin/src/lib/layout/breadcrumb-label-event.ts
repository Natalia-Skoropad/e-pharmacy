const BREADCRUMB_LABEL_EVENT = 'admin:breadcrumb-current-label';

//===================================================================

export type AdminBreadcrumbLabelEventDetail = Readonly<{
  pathname: string;
  label: string;
}>;

//===================================================================

export function dispatchAdminBreadcrumbLabel(label: string): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;

  const dispatch = () => {
    window.dispatchEvent(
      new CustomEvent<AdminBreadcrumbLabelEventDetail>(BREADCRUMB_LABEL_EVENT, {
        detail: { pathname, label },
      })
    );
  };

  if (typeof window.queueMicrotask === 'function') {
    window.queueMicrotask(dispatch);
    return;
  }

  void Promise.resolve().then(dispatch);
}

//===================================================================

export function subscribeToAdminBreadcrumbLabels(
  listener: (detail: AdminBreadcrumbLabelEventDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleBreadcrumbLabel = (event: Event) => {
    const { detail } = event as CustomEvent<AdminBreadcrumbLabelEventDetail>;

    if (!detail?.pathname || !detail.label) return;
    listener(detail);
  };

  window.addEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);

  return () => {
    window.removeEventListener(BREADCRUMB_LABEL_EVENT, handleBreadcrumbLabel);
  };
}
