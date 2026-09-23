import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveExternalAppDestination,
  resolveTrustedAdminExternalRedirectForDestinations,
} from './app-destinations';

//===================================================================

test('uses development defaults for client and pharmacy destinations', () => {
  const client = resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: undefined,
    nodeEnv: 'development',
  });

  const pharmacy = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: undefined,
    nodeEnv: 'development',
  });

  assert.equal(client.ok, true);
  assert.equal(pharmacy.ok, true);

  if (!client.ok || !pharmacy.ok) return;

  assert.equal(client.config.destinationUrl, 'http://localhost:3000/');

  assert.equal(
    pharmacy.config.destinationUrl,
    'http://localhost:3002/pharmacy/dashboard'
  );

  assert.equal(pharmacy.config.allowedPathPrefix, '/pharmacy');
});

//===================================================================

test('preserves application base paths', () => {
  const client = resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: 'https://client.example.com/storefront',
    nodeEnv: 'production',
  });

  const pharmacy = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: 'https://pharmacy.example.com/cabinet',
    nodeEnv: 'production',
  });

  assert.equal(client.ok, true);
  assert.equal(pharmacy.ok, true);

  if (!client.ok || !pharmacy.ok) return;

  assert.equal(
    client.config.destinationUrl,
    'https://client.example.com/storefront/'
  );

  assert.equal(
    pharmacy.config.destinationUrl,
    'https://pharmacy.example.com/cabinet/pharmacy/dashboard'
  );

  assert.equal(pharmacy.config.allowedPathPrefix, '/cabinet/pharmacy');
});

//===================================================================

test('production destinations fail closed when configuration is unsafe', () => {
  const missing = resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: undefined,
    nodeEnv: 'production',
  });

  const insecure = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: 'http://pharmacy.example.com',
    nodeEnv: 'production',
  });

  const credentials = resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: 'https://user:password@client.example.com',
    nodeEnv: 'production',
  });

  const query = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: 'https://pharmacy.example.com?debug=1',
    nodeEnv: 'production',
  });

  assert.deepEqual(
    [missing, insecure, credentials, query].map((result) => result.ok),
    [false, false, false, false]
  );
});

//===================================================================

test('pharmacy environment value must be the application base URL', () => {
  const result = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: 'https://pharmacy.example.com/pharmacy/dashboard',
    nodeEnv: 'production',
  });

  assert.equal(result.ok, false);

  if (result.ok) return;
  assert.equal(result.code, 'DASHBOARD_URL_INSTEAD_OF_BASE_URL');
});

//===================================================================

test('trusted redirects are limited to configured application origins and paths', () => {
  const client = resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: 'https://client.example.com',
    nodeEnv: 'production',
  });

  const pharmacy = resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: 'https://pharmacy.example.com',
    nodeEnv: 'production',
  });

  assert.equal(client.ok, true);
  assert.equal(pharmacy.ok, true);

  if (!client.ok || !pharmacy.ok) return;

  const destinations = [client.config, pharmacy.config] as const;

  assert.equal(
    resolveTrustedAdminExternalRedirectForDestinations(
      'https://client.example.com/',
      destinations
    ),
    'https://client.example.com/'
  );

  assert.equal(
    resolveTrustedAdminExternalRedirectForDestinations(
      'https://pharmacy.example.com/pharmacy/dashboard',
      destinations
    ),
    'https://pharmacy.example.com/pharmacy/dashboard'
  );

  assert.equal(
    resolveTrustedAdminExternalRedirectForDestinations(
      'https://evil.example.com/',
      destinations
    ),
    null
  );

  assert.equal(
    resolveTrustedAdminExternalRedirectForDestinations(
      'https://pharmacy.example.com/client-only',
      destinations
    ),
    null
  );
});
