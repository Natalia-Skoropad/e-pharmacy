import assert from 'node:assert/strict';
import test from 'node:test';

import { hasBrowserAuthSessionHint } from './auth-session-hint-cookie';
import { hasExactCookieValue } from './auth-session-hint-parser';

//===================================================================

const COOKIE_NAME = 'e_pharmacy_auth_ready';

//===================================================================

test('accepts only the exact BFF-owned auth hint value', () => {
  assert.equal(hasExactCookieValue(`${COOKIE_NAME}=1`, COOKIE_NAME, '1'), true);

  for (const value of ['', '0', 'false', 'broken', '2']) {
    assert.equal(
      hasExactCookieValue(`${COOKIE_NAME}=${value}`, COOKIE_NAME, '1'),
      false
    );
  }
});

//===================================================================

test('ignores malformed values and accepts a later valid duplicate', () => {
  assert.equal(
    hasExactCookieValue(
      `${COOKIE_NAME}=%E0%A4%A; ${COOKIE_NAME}=1`,
      COOKIE_NAME,
      '1'
    ),
    true
  );

  assert.equal(
    hasExactCookieValue(
      `${COOKIE_NAME}=broken; ${COOKIE_NAME}=false`,
      COOKIE_NAME,
      '1'
    ),
    false
  );
});

//===================================================================

test('does not match cookie-name prefixes', () => {
  assert.equal(
    hasExactCookieValue(`${COOKIE_NAME}_legacy=1`, COOKIE_NAME, '1'),
    false
  );
});

//===================================================================

test('handles cookie whitespace and a non-browser environment', () => {
  assert.equal(
    hasExactCookieValue(`  ${COOKIE_NAME}=1  ; other=value`, COOKIE_NAME, '1'),
    true
  );

  assert.equal(hasBrowserAuthSessionHint(), false);
});
