import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const readSource = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('no-match remote searches do not retain the All sentinel', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.match(source, /!pharmacySearch\.query\.trim\(\)/);
  assert.match(source, /!locationSearch\.query\.trim\(\)/);
  assert.match(source, /emptyMessage="No pharmacies found"/);
  assert.match(source, /emptyMessage="No locations found"/);
});

//===================================================================

test('pharmacy transitions show per-select loaders for selection and reset', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.equal((source.match(/isLoading=\{isPending\}/g) ?? []).length, 2);
  assert.match(source, /onClick=\{\(\) => navigate\(resetHref\)\}/);
});

//===================================================================

test('reset control has no empty grid track and fits mobile/tablet layouts', async () => {
  const [shell, styles] = await Promise.all([
    readSource('./CatalogFiltersShell/CatalogFiltersShell.tsx'),
    readSource('./CatalogFiltersShell/CatalogFiltersShell.module.css'),
  ]);

  assert.match(shell, /layout !== 'pharmacy' \|\| resetAction/);
  assert.match(shell, /resetAction && css\.searchGridPharmacyWithReset/);

  assert.match(
    styles,
    /\.pharmacyLayout \.desktopResetSlot > \* \{\s*width: 100%;/
  );

  assert.match(styles, /@media only screen and \(min-width: 768px\)/);
});

//===================================================================

test('bank-copy buttons share a fixed trailing action column', async () => {
  const [panel, styles, hook] = await Promise.all([
    readSource(
      '../pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
    ),

    readSource(
      '../pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.module.css'
    ),

    readSource(
      '../pharmacies/PharmacyDetailsPageContent/usePharmacyBankDetails.ts'
    ),
  ]);

  assert.match(panel, /className=\{css\.copyAction\}/);
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) 44px/);

  assert.match(
    styles,
    /grid-template-columns: minmax\(150px, 0\.42fr\) minmax\(0, 1fr\) 44px/
  );

  assert.match(hook, /stateRef\.current = \{ status: 'idle' \}/);
});
