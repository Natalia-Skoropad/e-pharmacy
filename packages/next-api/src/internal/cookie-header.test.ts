import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import {
  createAllowedAuthCookieHeader,
  createPrivateCookieHeaderWithAccessToken,
  parseCookieHeader,
} from './cookie-header.ts';

//===================================================================

const cookies = [
  'locale=uk',
  'analytics=abc',
  'e_pharmacy_access_token=old-access',
  'e_pharmacy_refresh_token=refresh',
  'e_pharmacy_auth_token=legacy',
  'e_pharmacy_access_token=fresh-access',
].join('; ');

//===================================================================

test('private requests forward only access and legacy cookies', () => {
  assert.equal(
    createAllowedAuthCookieHeader(cookies, 'access-only'),
    'e_pharmacy_access_token=fresh-access; e_pharmacy_auth_token=legacy'
  );
});

//===================================================================

test('refresh forwards only the refresh cookie', () => {
  assert.equal(
    createAllowedAuthCookieHeader(cookies, 'refresh-only'),
    'e_pharmacy_refresh_token=refresh'
  );
});

//===================================================================

test('public and unauthenticated auth requests forward no cookies', () => {
  assert.equal(createAllowedAuthCookieHeader(cookies, 'none'), undefined);
});

//===================================================================

test('private retry never copies unrelated or refresh cookies', () => {
  assert.equal(
    createPrivateCookieHeaderWithAccessToken(cookies, 'new-access'),
    'e_pharmacy_access_token=new-access; e_pharmacy_auth_token=legacy'
  );
});

//===================================================================

test('last duplicate wins and cookie values may contain equals signs', () => {
  const parsed = parseCookieHeader(
    `${ACCESS_TOKEN_COOKIE_NAME}=old; ${ACCESS_TOKEN_COOKIE_NAME}=new==; analytics=1`
  );

  assert.equal(parsed.get(ACCESS_TOKEN_COOKIE_NAME), 'new==');

  assert.equal(
    createAllowedAuthCookieHeader(
      `${REFRESH_TOKEN_COOKIE_NAME}=refresh==; locale=uk`,
      'refresh-only'
    ),
    `${REFRESH_TOKEN_COOKIE_NAME}=refresh==`
  );
});
