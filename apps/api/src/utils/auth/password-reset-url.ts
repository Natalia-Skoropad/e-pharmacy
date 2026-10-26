export function buildPasswordResetUrl(appUrl: string, token: string): string {
  const url = new URL('/reset-password', appUrl);
  const tokenParams = new URLSearchParams({ token }).toString();

  // The fragment remains the preferred browser-only handoff. The query copy is
  // an email-delivery compatibility fallback for links whose fragment is
  // stripped before the browser opens them. The reset page captures either
  // location and immediately removes both token copies from the visible URL.
  url.searchParams.set('token', token);
  url.hash = tokenParams;

  return url.toString();
}
