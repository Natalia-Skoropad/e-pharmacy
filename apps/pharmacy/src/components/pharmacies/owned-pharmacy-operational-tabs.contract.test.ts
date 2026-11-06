import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

const ROOT = process.cwd();

//===================================================================

const pharmacy = (path: string) =>
  readFileSync(join(ROOT, 'src', path), 'utf8');

//===================================================================

test('all operational browser APIs use the selected pharmacy through the private adapter', () => {
  for (const name of ['orders', 'products', 'product-requests']) {
    assert.match(
      pharmacy(`lib/api/browser/${name}.api.ts`),
      /operationalLocalApiRequest as localApiRequest/
    );
  }

  const clientsApi = pharmacy('lib/api/browser/clients.api.ts');

  assert.match(
    clientsApi,
    /params\.scope === 'owner' \? localApiRequest : operationalLocalApiRequest/
  );

  assert.match(
    clientsApi,
    /await operationalLocalApiRequest\(path, sanitizeBrowserReadRequestOptions\(options\)\)/
  );

  const scoped = pharmacy('lib/api/browser/operational-request.ts');

  assert.match(scoped, /getAuthorizedPharmacySelection\(\)/);
  assert.match(scoped, /headers\.set\('X-Pharmacy-ID', pharmacyId\)/);
  assert.match(scoped, /from '@e-pharmacy\/next-api\/browser'/);
  assert.doesNotMatch(scoped, /\bfetch\s*\(/);

  assert.match(
    pharmacy('lib/api/browser/pharmacy.api.ts'),
    /operationalLocalApiRequest\(\s*path,\s*sanitizeBrowserReadRequestOptions\(options\)\s*\)/
  );
});

//===================================================================

test('the owner detail mounts the existing operational components, not new copies', () => {
  const detail = pharmacy(
    'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  for (const name of [
    'OrdersPageContent',
    'ClientsPageContent',
    'OwnProductsPageContent',
  ]) {
    assert.match(detail, new RegExp(`<${name}\\s+key=`));
    assert.match(detail, new RegExp(`<${name}[^>]+embedded`));
  }

  assert.doesNotMatch(detail, /Pharmacy orders are not connected yet/);

  assert.doesNotMatch(
    detail,
    /<ProductRequestsPageContent|value: 'product-requests'/
  );

  assert.match(detail, /selectedId !== pharmacyId/);
  assert.match(detail, /initialClientPagination/);
  assert.match(detail, /visibleTab === 'reviews'|reviews: \{/);
});

//===================================================================

test('the shell gates the old menu and preserves the choice across page navigation', () => {
  const shell = pharmacy('components/layout/PharmacyShell/PharmacyShell.tsx');

  const controls = pharmacy(
    'components/layout/PharmacyShell/PharmacySelectionControls.tsx'
  );

  const provider = pharmacy(
    'providers/PharmacySelectionProvider/PharmacySelectionProvider.tsx'
  );

  assert.match(shell, /<PharmacySelectionProvider>/);
  assert.match(shell, /<PharmacyOperationalScope>/);
  assert.match(shell, /key=\{selectedId \?\? 'unselected'\}/);
  assert.match(controls, /Select a pharmacy/);
  assert.match(controls, /Current pharmacy/);
  assert.match(provider, /getOwnedPharmacyMemberships/);
  assert.match(provider, /resolveSelectedPharmacyId/);

  assert.match(
    pharmacy('lib/pharmacies/selected-pharmacy-scope.ts'),
    /memberships\.length === 1/
  );

  assert.match(provider, /sessionStorage\.setItem/);
  assert.match(provider, /readExplicitPharmacySelection/);

  for (const menu of [
    'PharmacySidebar/PharmacySidebar.tsx',
    'PharmacyMobileMenu/PharmacyMobileMenu.tsx',
  ]) {
    assert.match(
      pharmacy(`components/layout/${menu}`),
      /withSelectedPharmacyQuery/
    );
  }
});
