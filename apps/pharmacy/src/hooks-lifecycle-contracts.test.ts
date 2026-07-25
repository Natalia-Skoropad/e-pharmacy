import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

async function readSource(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

//===================================================================

test('pharmacy profile has one provider-owned request source', async () => {
  const provider = await readSource(
    './providers/PharmacyProfileProvider/PharmacyProfileProvider.tsx'
  );
  const profilePage = await readSource(
    './components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  );

  assert.match(provider, /getMyPharmacyProfile/);
  assert.match(provider, /identityRef/);
  assert.match(provider, /requestVersionRef/);
  assert.match(provider, /syncProfile/);
  assert.doesNotMatch(profilePage, /getMyPharmacyProfile/);
  assert.match(profilePage, /usePharmacyProfile/);
});

//===================================================================

test('list and detail effects use AbortController rather than mounted flags', async () => {
  const sources = await Promise.all([
    readSource('./components/orders/OrdersPageContent/OrdersPageContent.tsx'),
    readSource('./components/clients/ClientsPageContent/ClientsPageContent.tsx'),
    readSource(
      './components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
    readSource(
      './components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),
    readSource(
      './components/layout/PharmacySidebar/PharmacySidebar.tsx'
    ),
    readSource('./components/comments/EntityComments/EntityComments.tsx'),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /let (?:isMounted|isCancelled) =/);
    assert.match(source, /AbortController/);
  }
});

//===================================================================

test('URL filters and outside-pointer behavior use shared hooks', async () => {
  const orders = await readSource(
    './components/orders/OrdersPageContent/OrdersPageContent.tsx'
  );
  const header = await readSource(
    './components/layout/PharmacyHeader/PharmacyHeader.tsx'
  );

  assert.match(orders, /@e-pharmacy\/hooks\/timing/);
  assert.match(orders, /useDebouncedValue/);
  assert.match(header, /@e-pharmacy\/hooks\/dom/);
  assert.match(header, /useOutsidePointerDown/);
});

//===================================================================

test('sidebar storage and breadcrumb dispatch remain hydration and timer safe', async () => {
  const shell = await readSource(
    './components/layout/PharmacyShell/PharmacyShell.tsx'
  );
  const breadcrumbs = await readSource('./lib/layout/breadcrumbs.ts');

  assert.match(shell, /useSyncExternalStore/);
  assert.match(shell, /getServerSidebarCollapsedSnapshot/);
  assert.doesNotMatch(breadcrumbs, /setTimeout/);
  assert.match(breadcrumbs, /queueMicrotask|Promise\.resolve/);
});
