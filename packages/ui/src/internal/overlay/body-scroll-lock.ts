type BodyStyleSnapshot = Readonly<{
  overflow: string;
  paddingRight: string;
}>;

//===================================================================

let lockCount = 0;
let originalStyles: BodyStyleSnapshot | null = null;
let appliedPaddingRight = '';

//===================================================================

export function lockBodyScroll(): void {
  if (lockCount > 0) {
    lockCount += 1;
    return;
  }

  const body = document.body;
  const scrollbarWidth = Math.max(
    0,
    window.innerWidth - document.documentElement.clientWidth
  );

  originalStyles = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  body.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    const currentPadding = Number.parseFloat(
      window.getComputedStyle(body).paddingRight
    );

    appliedPaddingRight = `${
      (Number.isFinite(currentPadding) ? currentPadding : 0) + scrollbarWidth
    }px`;

    body.style.paddingRight = appliedPaddingRight;
  }

  lockCount = 1;
}

//===================================================================

export function unlockBodyScroll(): void {
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0 || !originalStyles) return;

  const body = document.body;

  if (body.style.overflow === 'hidden') {
    body.style.overflow = originalStyles.overflow;
  }

  if (!appliedPaddingRight || body.style.paddingRight === appliedPaddingRight) {
    body.style.paddingRight = originalStyles.paddingRight;
  }

  originalStyles = null;
  appliedPaddingRight = '';
}

//===================================================================

export function resetBodyScrollLockForTests(): void {
  while (lockCount > 0) unlockBodyScroll();
}
