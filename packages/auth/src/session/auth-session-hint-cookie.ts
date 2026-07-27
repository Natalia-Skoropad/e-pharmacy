import { AUTH_READY_COOKIE_NAME } from '@e-pharmacy/config/auth';

import { hasExactCookieValue } from './auth-session-hint-parser';

//===================================================================

const AUTH_SESSION_HINT_VALUE = '1';

//===================================================================

function canUseBrowserCookies(): boolean {
  return typeof document !== 'undefined';
}

//===================================================================

export function hasBrowserAuthSessionHint(): boolean {
  if (!canUseBrowserCookies()) return false;

  return hasExactCookieValue(
    document.cookie,
    AUTH_READY_COOKIE_NAME,
    AUTH_SESSION_HINT_VALUE
  );
}
