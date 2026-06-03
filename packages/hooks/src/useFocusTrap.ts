'use client';

import { useEffect, type RefObject } from 'react';

//===================================================================

type FocusableContainer = HTMLElement | null;

type UseFocusTrapParams<TContainer extends FocusableContainer> = {
  isOpen: boolean;
  containerRef: RefObject<TContainer>;
  restoreFocus?: boolean;
};

//===================================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

//===================================================================

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.offsetParent !== null
  );
}

//===================================================================

export function useFocusTrap<TContainer extends FocusableContainer>({
  isOpen,
  containerRef,
  restoreFocus = true,
}: UseFocusTrapParams<TContainer>): void {
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement;
    const container = containerRef.current;

    if (!container) return;

    const focusableElements = getFocusableElements(container);
    const firstFocusableElement = focusableElements[0] ?? container;

    window.requestAnimationFrame(() => {
      firstFocusableElement.focus({ preventScroll: true });
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;

      const currentFocusableElements = getFocusableElements(container);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (
        restoreFocus &&
        previouslyFocusedElement instanceof HTMLElement &&
        document.contains(previouslyFocusedElement)
      ) {
        previouslyFocusedElement.focus({ preventScroll: true });
      }
    };
  }, [containerRef, isOpen, restoreFocus]);
}
