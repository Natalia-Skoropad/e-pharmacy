import assert from 'node:assert/strict';
import test from 'node:test';

import type { PharmacyAppConfiguration } from './pharmacy-app-config';
import { resolvePharmacyLoginDestination } from './resolve-login-destination';

//===================================================================

const PHARMACY_CONFIG: PharmacyAppConfiguration = {
  baseUrl: 'https://apps.example.com/pharmacy-app/',
  origin: 'https://apps.example.com',
  dashboardUrl: 'https://apps.example.com/pharmacy-app/pharmacy/dashboard',
  allowedPathPrefix: '/pharmacy-app/pharmacy',
};

//===================================================================

test('pharmacy login returns to a trusted pharmacy application URL', () => {
  assert.equal(
    resolvePharmacyLoginDestination(
      'https://apps.example.com/pharmacy-app/pharmacy/orders/507f1f77bcf86cd799439011',
      PHARMACY_CONFIG
    ),

    'https://apps.example.com/pharmacy-app/pharmacy/orders/507f1f77bcf86cd799439011'
  );
});

//===================================================================

test('pharmacy login rejects foreign, malformed and double-encoded redirects', () => {
  for (const candidate of [
    'https://evil.example.com/pharmacy/orders/1',
    'not a url',
    'https%3A%2F%2Fapps.example.com%2Fpharmacy-app%2Fpharmacy%2Forders%2F1',
    'https://apps.example.com/not-pharmacy/orders/1',
  ]) {
    assert.equal(
      resolvePharmacyLoginDestination(candidate, PHARMACY_CONFIG),
      PHARMACY_CONFIG.dashboardUrl
    );
  }
});

//===================================================================

test('pharmacy login falls back to dashboard when no return URL was requested', () => {
  assert.equal(
    resolvePharmacyLoginDestination(null, PHARMACY_CONFIG),
    PHARMACY_CONFIG.dashboardUrl
  );
});
