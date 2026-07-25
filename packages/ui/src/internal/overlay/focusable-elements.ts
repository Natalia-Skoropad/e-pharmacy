const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

//===================================================================

function isInsideDisabledFieldset(element: HTMLElement): boolean {
  const fieldset = element.closest('fieldset:disabled');
  if (!(fieldset instanceof HTMLFieldSetElement)) return false;

  const firstLegend = Array.from(fieldset.children).find(
    (child): child is HTMLLegendElement => child instanceof HTMLLegendElement
  );

  return !firstLegend?.contains(element);
}

//===================================================================

function hasHiddenAncestor(element: HTMLElement): boolean {
  return Boolean(
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  );
}

//===================================================================

export function isFocusableElement(
  element: HTMLElement | null
): element is HTMLElement {
  if (!element || !element.isConnected) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  if (element.tabIndex < 0 && !element.isContentEditable) return false;
  if (hasHiddenAncestor(element) || isInsideDisabledFieldset(element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  return true;
}

//===================================================================

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(isFocusableElement);
}

//===================================================================

export function focusWithoutScroll(element: HTMLElement | null): boolean {
  if (!isFocusableElement(element)) return false;

  element.focus({ preventScroll: true });
  return document.activeElement === element;
}
