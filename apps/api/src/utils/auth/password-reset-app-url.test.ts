import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePasswordResetAppUrl } from './password-reset-app-url';

//===============================================================

const urls = {
  client: 'https://client.example.com',
  pharmacy: 'https://pharmacy.example.com',
  admin: 'https://admin.example.com',
};

//===============================================================

test('routes password reset to the selected frontend application', () => {
  assert.equal(
    resolvePasswordResetAppUrl('client', urls),
    'https://client.example.com'
  );

  assert.equal(
    resolvePasswordResetAppUrl('pharmacy', urls),
    'https://pharmacy.example.com'
  );

  assert.equal(
    resolvePasswordResetAppUrl('admin', urls),
    'https://admin.example.com'
  );
});

//===============================================================

test('keeps the legacy pharmacy fallback but never falls admin back to client', () => {
  assert.equal(
    resolvePasswordResetAppUrl('pharmacy', {
      client: 'https://client.example.com',
    }),
    'https://client.example.com'
  );

  assert.throws(
    () =>
      resolvePasswordResetAppUrl('admin', {
        client: 'https://client.example.com',
      }),
    /not configured for application: admin/
  );
});
