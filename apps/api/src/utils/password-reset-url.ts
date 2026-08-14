export function buildPasswordResetUrl(appUrl: string, token: string): string {
  const url = new URL('/reset-password', appUrl);

  // Keep the raw reset secret out of the HTTP request target. URL fragments are
  // handled only by the browser and are captured/scrubbed by the reset page.
  url.hash = new URLSearchParams({ token }).toString();

  return url.toString();
}
