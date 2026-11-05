import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

//===================================================================

const read = (path) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

//===================================================================

const selectors = [
  'apps/admin/src/components/pharmacies/PharmacySearch/PharmacySearch.tsx',
  'apps/admin/src/components/pharmacy-owners/PharmacyOwnerSearch/PharmacyOwnerSearch.tsx',
];

//===================================================================

for (const path of selectors) {
  test(`${path}: pagination state changes belong to user callbacks, not effect setup`, () => {
    const source = read(path);

    const effect = source.slice(
      source.indexOf('  useEffect(() => {'),
      source.indexOf('  }, [debouncedQuery')
    );

    assert.doesNotMatch(effect, /\bsetLoadingPage\(true\)/);
    assert.doesNotMatch(effect, /\bsetLoadMoreError\(null\)/);

    assert.match(
      source,
      /onLoadMore=\{\(\) => \{[\s\S]*?setLoadingPage\(true\);[\s\S]*?setLoadMoreError\(null\);/
    );

    assert.match(
      source,
      /onQueryChange=\{\(next\) => \{[\s\S]*?setLoadingPage\(false\);[\s\S]*?setLoadMoreError\(null\);/
    );
  });
}

//===================================================================

test('shared identifier helper supports old three-argument callers and four-argument tab filters', () => {
  const source = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/DuplicateIdentifierSaveModal.tsx'
  );

  assert.match(
    source,
    /fields: readonly ReusedField\[\] = DEFAULT_REUSED_FIELDS/
  );

  assert.match(
    source,
    /value !== savedValue && normalizeMatches\(matches, field\)\.length > 0/
  );

  assert.match(
    source,
    /'phone',[\s\S]*?'email',[\s\S]*?'taxId',[\s\S]*?'iban',[\s\S]*?'receiptEmail'/
  );
});
