import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd();

//===================================================================

const read = (path: string) => readFile(join(root, 'src', path), 'utf8');

//===================================================================

test('pharmacy Products reuses owner registry with fixed pharmacy scope and canonical URL', async () => {
  const [page, nestedRoute, paths] = await Promise.all([
    read(
      'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
    ),

    read('app/pharmacy/pharmacies/[...filters]/page.tsx'),
    read('lib/products/own-product-paths.ts'),
  ]);

  assert.match(page, /<OwnerOwnProductsPageContent/);
  assert.match(page, /embeddedPharmacyId=\{pharmacyId\}/);
  assert.match(page, /<ProfileSectionHeader/);
  assert.match(nestedRoute, /parseOwnProductsSegments/);
  assert.match(nestedRoute, /buildEmbeddedOwnProductsPath/);
  assert.match(paths, /buildEmbeddedOwnProductsPath/);

  assert.match(
    paths,
    /\$\{PHARMACY_ROUTES.PHARMACIES\}\/\$\{pharmacyId\}\/products/
  );
});

//===================================================================

test('client purchased products use owner scoped data and URL filters', async () => {
  const [detail, routes, browser] = await Promise.all([
    read(
      'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
    ),

    read('lib/clients/client-purchased-products-paths.ts'),
    read('lib/api/browser/clients.api.ts'),
  ]);

  assert.match(detail, /scope: 'owner'/);
  assert.match(detail, /parseClientPurchasedProductsPath/);
  assert.match(detail, /changeProductFilters/);
  assert.match(routes, /product-id-/);
  assert.match(routes, /per-page-/);
  assert.match(routes, /date-from-/);

  assert.match(
    browser,
    /params\.scope === 'owner' \? localApiRequest : operationalLocalApiRequest/
  );
});

//===================================================================

test('operational product tabs live in OwnProductDetailsPageContent, not in global catalog', async () => {
  const [globalCard, ownCard, tabRoutes, list] = await Promise.all([
    read(
      'components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
    ),

    read(
      'components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx'
    ),

    read('lib/products/all-product-detail-tabs.ts'),

    read(
      'components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),
  ]);

  for (const tab of ['pharmacies', 'related-orders', 'clients', 'statistics']) {
    assert.ok(
      !tabRoutes.includes(`'${tab}'`),
      `Global catalog must not expose ${tab}`
    );

    assert.ok(ownCard.includes(`'${tab}'`), `Own product missing ${tab}`);
  }

  assert.doesNotMatch(
    globalCard,
    /<OwnProductStatisticsTab|<OwnProductClientsTab/
  );

  assert.match(ownCard, /<OwnProductStatisticsTab/);
  assert.match(globalCard, /<OwnerAddProductConfirmation/);
  assert.match(list, /<OwnerAddProductConfirmation/);
});

//===================================================================

test('tooltip and remove buttons preserve portal and icon behaviour', async () => {
  const [table, metrics, ownTable, floatingTooltip] = await Promise.all([
    read('components/clients/ClientsTable/ClientsTable.tsx'),

    read(
      '../../../packages/ui/src/overlays/OrderMetricsTooltip/OrderMetricsTooltip.tsx'
    ).catch(() => ''),

    read('components/products/OwnProductsTable/OwnProductsTable.tsx'),

    read('../../../packages/ui/src/overlays/InfoTooltip/InfoTooltip.tsx').catch(
      () => ''
    ),
  ]);

  assert.match(table, /preferTopLayer/);
  assert.match(ownTable, /iconLeft=\{<Trash2/);

  // The corresponding shared UI modules are checked separately from the monorepo root.
  if (metrics) assert.match(metrics, /scrollable/);

  if (floatingTooltip)
    assert.match(floatingTooltip, /maxHeight: floatingPosition\.maxHeight/);
});
