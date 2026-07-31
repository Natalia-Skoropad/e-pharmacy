export type DesktopBreakpointChangeEvent = Readonly<{ matches: boolean }>;

//===================================================================

export type DesktopBreakpointMediaQuery = Readonly<{
  matches: boolean;

  addEventListener: (
    type: 'change',
    listener: (event: DesktopBreakpointChangeEvent) => void
  ) => void;

  removeEventListener: (
    type: 'change',
    listener: (event: DesktopBreakpointChangeEvent) => void
  ) => void;
}>;

//===================================================================

export function subscribeToDesktopBreakpoint(
  mediaQuery: DesktopBreakpointMediaQuery,
  onDesktop: () => void
): () => void {
  const closeWhenDesktop = (matches: boolean) => {
    if (matches) onDesktop();
  };

  const handleChange = (event: DesktopBreakpointChangeEvent) => {
    closeWhenDesktop(event.matches);
  };

  closeWhenDesktop(mediaQuery.matches);
  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}
