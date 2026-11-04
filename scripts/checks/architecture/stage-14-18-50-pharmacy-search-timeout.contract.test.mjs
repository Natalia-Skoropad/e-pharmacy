import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');

//===================================================================

test('only the public pharmacy search-options route opts into the longer BFF timeout', () => {
  const route = read(
    'apps/client/src/app/api/pharmacies/search-options/route.ts'
  );

  const proxy = read('packages/next-api/src/proxy/public-backend-proxy.ts');
  const factory = read('packages/next-api/src/proxy/route-factories.ts');
  const browser = read('apps/client/src/lib/api/browser/pharmacies.api.ts');
  const policy = read('packages/next-api/src/internal/transport-policy.ts');

  assert.match(route, /timeoutMs:\s*18_000/);
  assert.match(route, /API_ROUTES\.pharmacies\.searchOptions/);
  assert.match(proxy, /timeoutMs = NEXT_API_TIMEOUTS_MS\.publicRead/);
  assert.match(proxy, /timeoutMs,\s*authCookieMode: 'none'/);
  assert.match(factory, /proxyPublicBackendRequest\(\{[\s\S]*?timeoutMs/);
  assert.match(browser, /getPharmacySearchOptions = \(/);
  assert.match(browser, /timeoutMs: 20_000/);
  assert.match(policy, /publicRead:\s*6_000/);
  assert.match(browser, /\.\.\.options,\s*timeoutMs: 20_000/);
});

//===================================================================

test('dropdown soft-error aligns icon, text and retry button without wrapping the action row', () => {
  const css = read(
    'packages/ui/src/forms/SearchableSelect/SearchableSelect.module.css'
  );

  const select = read(
    'packages/ui/src/forms/SearchableSelect/SearchableSelect.tsx'
  );

  const notice = css.match(/\.loadMoreErrorNotice \{([^}]+)\}/)?.[1] ?? '';

  assert.match(notice, /display: grid/);
  assert.match(notice, /grid-template-columns: auto minmax\(0, 1fr\) auto/);
  assert.match(notice, /align-items: center/);
  assert.doesNotMatch(notice, /flex-wrap: wrap/);

  assert.match(
    css,
    /\.loadMoreErrorNotice \.retryButton \{[\s\S]*?white-space: nowrap/
  );

  assert.match(select, /<RotateCcw size=\{16\}/);

  assert.match(
    css,
    /\.retryButton:focus-visible \{\s*outline: 2px solid var\(--color-accent\)/
  );
});

//===================================================================

test('search options reports separate slow read and count without changing filter contracts', () => {
  const source = read(
    'apps/api/src/services/pharmacies/pharmacy-search-options.service.ts'
  );

  assert.match(source, /createFlexibleSearchRegExp\(search\)/);
  assert.match(source, /\.sort\(\{ name: 1, _id: 1 \}\)/);
  assert.match(source, /Pharmacy\.countDocuments\(filter\)/);
  assert.match(source, /slow public pharmacy search options/);
  assert.match(source, /rowsReadMs/);
  assert.match(source, /countReadMs/);
  assert.match(source, /hasQuery: Boolean\(search\)/);
  assert.doesNotMatch(source, /query: search|searchTerm: search/);
});

//===================================================================

test('MongoDB diagnosis uses project development secret wrapper and offers a read-only search mode', () => {
  const pkg = read('apps/api/package.json');

  const script = read(
    'apps/api/src/scripts/diagnostics/diagnose-pharmacy-reactivation.ts'
  );

  assert.match(
    pkg,
    /"diagnose:pharmacy-reactivation": "node \.\.\/\.\.\/scripts\/dev\/run-with-bff-secret\.mjs tsx/
  );

  assert.match(script, /mode === 'search'/);
  assert.match(script, /getPharmacySearchOptionsService/);
  assert.match(script, /autoIndex: false/);
  assert.match(script, /autoCreate: false/);
  assert.doesNotMatch(script, /\.updateOne\(|\.deleteMany\(|\.create\(/);
});
