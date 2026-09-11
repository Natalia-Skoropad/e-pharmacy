import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

const READ_ADAPTERS = [
  'clients.api.ts',
  'orders.api.ts',
  'products.api.ts',
  'product-requests.api.ts',
  'pharmacy.api.ts',
  'pharmacy-notes.api.ts',
] as const;

//===================================================================

test('pharmacy browser read adapters expose only the narrow read options contract', () => {
  const browserDirectory = join(process.cwd(), 'src', 'lib', 'api', 'browser');

  for (const fileName of READ_ADAPTERS) {
    const source = readFileSync(join(browserDirectory, fileName), 'utf8');

    assert.doesNotMatch(source, /options\??:\s*JsonResponseRequestOptions/);
    assert.doesNotMatch(source, /localApiRequest\(path,\s*options\)/);
    assert.match(source, /BrowserReadRequestOptions/);
    assert.match(source, /sanitizeBrowserReadRequestOptions\(options\)/);
  }
});

//===================================================================

test('aggregate statistics helpers cannot widen browser transport options', () => {
  const sourceFiles = [
    join(process.cwd(), 'src', 'lib', 'clients', 'client-statistics.ts'),
    join(process.cwd(), 'src', 'lib', 'products', 'product-statistics.ts'),
    join(
      process.cwd(),
      'src',
      'lib',
      'product-requests',
      'product-request-statistics.ts'
    ),
  ];

  for (const sourceFile of sourceFiles) {
    const source = readFileSync(sourceFile, 'utf8');
    assert.match(source, /BrowserReadRequestOptions/);
    assert.doesNotMatch(source, /JsonResponseRequestOptions/);
  }
});
