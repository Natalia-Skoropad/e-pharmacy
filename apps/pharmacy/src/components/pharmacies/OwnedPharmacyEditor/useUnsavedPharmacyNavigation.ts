'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

//===================================================================

/** Keeps branded in-app navigation confirmation and browser-native unload protection separate. */
export function useUnsavedPharmacyNavigation(isDirty: boolean) {
  const router = useRouter();
  const allowNavigateRef = useRef(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // Unsaved changes are confirmed with our shared modal for in-app navigation.
  // Tab close/reload uses the native browser dialog, while in-app navigation
  // retains the branded confirmation modal.
  useEffect(() => {
    const interceptLink = (event: MouseEvent) => {
      if (
        !isDirty ||
        allowNavigateRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const target = event.target;

      const link = target instanceof Element ? target.closest('a[href]') : null;

      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === '_blank' ||
        link.hasAttribute('download')
      )
        return;

      const href = link.href;

      if (
        !href ||
        new URL(href).origin !== location.origin ||
        href === location.href ||
        (new URL(href).hash && new URL(href).pathname === location.pathname)
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      pendingNavigationRef.current = () => {
        allowNavigateRef.current = true;
        router.push(href);
      };

      setLeaveDialogOpen(true);
    };

    const editorPath = window.location.pathname + window.location.search;

    const onPopState = () => {
      if (!isDirty || allowNavigateRef.current) return;

      const destination = window.location.pathname + window.location.search;

      // Restore the editor URL before Next processes the navigation.
      window.history.pushState(null, '', editorPath);

      pendingNavigationRef.current = () => {
        allowNavigateRef.current = true;
        router.push(destination);
      };

      setLeaveDialogOpen(true);
    };

    document.addEventListener('click', interceptLink, true);
    window.addEventListener('popstate', onPopState, true);

    return () => {
      document.removeEventListener('click', interceptLink, true);
      window.removeEventListener('popstate', onPopState, true);
    };
  }, [isDirty, router]);

  useEffect(() => {
    if (!isDirty || allowNavigateRef.current) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigateRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  return {
    allowNavigateRef,
    pendingNavigationRef,
    leaveDialogOpen,
    setLeaveDialogOpen,
  };
}
