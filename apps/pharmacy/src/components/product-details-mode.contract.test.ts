import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const globalCard =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

const ownCard =
  'src/components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx';

//===================================================================

test('global and own product cards have independent implementations and routes', async () => {
  const [global, own, globalPage, ownPage] = await Promise.all([
    read(globalCard),
    read(ownCard),
    read('src/app/pharmacy/all-products/[productId]/page.tsx'),
    read('src/app/pharmacy/products/[productId]/page.tsx'),
  ]);

  assert.doesNotMatch(
    global,
    /ProductDetailsMode|mode === 'own'|OwnProductStatistics|scope: 'owner'/
  );

  assert.doesNotMatch(
    own,
    /AllProductDetailsPageContent|mode="own"|OwnerAddProductConfirmation/
  );

  assert.match(
    globalPage,
    /<AllProductDetailsPageContent productId=\{productId\}/
  );

  assert.match(
    ownPage,
    /<OwnProductDetailsPageContent productId=\{productId\}/
  );

  assert.match(global, /<OwnerAddProductConfirmation/);
  assert.match(own, /Remove product from pharmacy\?/);
});

//===================================================================

test('stock analytics read actual per-pharmacy offers, not invented zero stock', async () => {
  const [owner, detail, statistics] = await Promise.all([
    read(ownCard),

    read(
      'src/components/products/OwnProductDetailsPageContent/OwnProductDetailsTab.tsx'
    ),

    read(
      'src/components/products/OwnProductDetailsPageContent/OwnProductStatisticsTab.tsx'
    ),
  ]);

  assert.match(owner, /getProductOffer\(product, currentPharmacyId\)/);
  assert.match(owner, /!selectedOffer\.hasRelatedOrders/);
  assert.match(detail, /formatShortDate\(dateAdded/);

  assert.match(
    statistics,
    /product\.offers\.reduce<OwnProductStatisticsCounts>/
  );

  assert.match(statistics, /offer\.availableQuantity/);
});
