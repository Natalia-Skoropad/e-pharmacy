// Keep the entire calendar in the viewport, even when its trigger is inside
// a narrow, scrollable drawer. Prefer below, then above when space permits.
export function placeCalendarPopover(
  anchor: Readonly<{ left: number; top: number; bottom: number }>,
  popup: Readonly<{ width: number; height: number }>,
  viewport: Readonly<{ width: number; height: number }>
): Readonly<{ top: number; left: number }> {
  const inset = 12;
  const gap = 8;
  const popupHeight = Math.min(popup.height, viewport.height - inset * 2);
  const below = anchor.bottom + gap;
  const above = anchor.top - popupHeight - gap;

  const top =
    below + popupHeight <= viewport.height - inset
      ? below
      : above >= inset
        ? above
        : Math.max(
            inset,
            Math.min(below, viewport.height - inset - popupHeight)
          );

  const left = Math.max(
    inset,
    Math.min(anchor.left, viewport.width - inset - popup.width)
  );

  return { top, left };
}
