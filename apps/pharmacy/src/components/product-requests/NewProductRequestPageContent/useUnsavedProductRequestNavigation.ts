import { useEffect, useRef, useState } from 'react';

//===================================================================

// A reusable navigation guard for new, copied, and existing product requests.
// In-app links and browser Back show our modal; reload and tab close use the
// browser's own beforeunload confirmation.
export function useUnsavedProductRequestNavigation(
  isDirty: boolean,
  pathname: string
) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  // Confirmation bypasses only the current navigation, not subsequent edits
  // if Next.js retains this component while switching tabs.
  useEffect(() => {
    allowNavigationRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!isDirty || allowNavigationRef.current) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };

    const onLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;

      const target = event.target;

      const anchor =
        target instanceof Element ? target.closest('a[href]') : null;

      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.origin !== window.location.origin ||
        (anchor.pathname === pathname &&
          anchor.search === window.location.search)
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setPendingPath(anchor.pathname + anchor.search + anchor.hash);
    };

    const currentPath = window.location.pathname + window.location.search;

    const onPopState = () => {
      if (allowNavigationRef.current) return;

      const destination = window.location.pathname + window.location.search;

      if (destination === currentPath) return;

      // The editor must stay visible while the user decides whether to leave.
      window.history.pushState(null, '', currentPath);
      setPendingPath(destination);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onLinkClick, true);
    window.addEventListener('popstate', onPopState, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onLinkClick, true);
      window.removeEventListener('popstate', onPopState, true);
    };
  }, [isDirty, pathname]);

  return { pendingPath, setPendingPath, allowNavigationRef };
}
