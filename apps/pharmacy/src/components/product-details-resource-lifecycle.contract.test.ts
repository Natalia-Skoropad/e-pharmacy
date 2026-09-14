import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const DETAILS_PATH =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

//===================================================================

async function readDetails(): Promise<string> {
  return readFile(resolve(process.cwd(), DETAILS_PATH), 'utf8');
}

//===================================================================

test('initial product details load owns only the required product request', async () => {
  const source = await readDetails();
  const initialStart = source.indexOf('async function loadProductData()');

  const initialEnd = source.indexOf(
    'dispatchPharmacyBreadcrumbLabel',
    initialStart
  );

  const initialLoad = source.slice(initialStart, initialEnd);

  assert.match(initialLoad, /getProductDetails\(productId/);
  assert.equal((initialLoad.match(/getProductDetails\(/g) ?? []).length, 1);
  assert.doesNotMatch(initialLoad, /getProductReviews/);
  assert.doesNotMatch(initialLoad, /getPharmacyOrders/);
  assert.doesNotMatch(initialLoad, /getProductStockMovements/);
  assert.doesNotMatch(initialLoad, /Promise\.all/);

  assert.match(source, /activeTab !== 'reviews'/);
  assert.match(source, /product\?\.reviewsCount \?\? null/);
  assert.match(source, /Reviews \(\$\{displayedReviewsTotal\}\)/);
  assert.match(source, /activeTab !== 'stock-movement'/);
  assert.match(source, /activeTab !== 'related-orders'/);
});

//===================================================================

test('related orders use backend pagination instead of a capped local dataset', async () => {
  const source = await readDetails();

  assert.doesNotMatch(source, /perPage:\s*200/);
  assert.match(source, /page:\s*relatedCurrentPage/);
  assert.match(source, /perPage:\s*relatedRowsPerPage/);
  assert.match(source, /setRelatedOrdersTotal\(response\.total\)/);
  assert.match(source, /setRelatedOrdersTotalPages\(normalizedTotalPages\)/);
  assert.match(source, /shown=\{relatedOrderRows\.length\}/);
  assert.match(source, /total=\{relatedOrdersTotal\}/);
  assert.match(source, /items=\{relatedOrderRows\}/);
  assert.doesNotMatch(source, /paginatedRelatedOrderRows/);
});

//===================================================================

test('stock summary never reconstructs reserved stock from related orders', async () => {
  const source = await readDetails();

  assert.doesNotMatch(source, /getActiveOrdersReservedQuantity/);
  assert.doesNotMatch(source, /activeOrdersReservedQuantity/);
  assert.doesNotMatch(source, /stockQuantity\s*-\s*reservedQuantity/);

  assert.match(
    source,
    /stockBalance\?\.reservedQuantity\s*\?\?\s*offer\.reservedQuantity/
  );

  assert.match(
    source,
    /stockBalance\?\.availableQuantity\s*\?\?\s*offer\.availableQuantity/
  );
});

//===================================================================

test('supporting resources expose unavailable states instead of fake empty or zero data', async () => {
  const source = await readDetails();

  for (const status of [
    'reviewsStatus',
    'stockStatus',
    'relatedOrdersStatus',
    'productSalesStatus',
    'commentsTotalStatus',
  ]) {
    assert.match(source, new RegExp(status));
  }

  assert.match(source, /Reviews are temporarily unavailable/);
  assert.match(source, /Stock movement is temporarily unavailable/);
  assert.match(source, /Related orders are temporarily unavailable/);
  assert.match(source, /Sales analytics are temporarily unavailable/);
  assert.match(source, /setCommentsTotal\(null\)/);
  assert.match(source, /commentsTotalStatus === 'success'/);

  const commentsSource = await readFile(
    resolve(
      process.cwd(),
      'src/components/comments/EntityComments/EntityComments.tsx'
    ),

    'utf8'
  );

  assert.match(commentsSource, /!error \? \([\s\S]{0,180}?<CountLabel/);

  assert.doesNotMatch(
    source,
    /getProductReviews\([^)]*\)\.catch\(\(\) => null\)/
  );

  assert.doesNotMatch(
    source,
    /setProductSalesData\(DEFAULT_ORDER_SALES_STATISTICS\)[\s\S]{0,120}catch/
  );
});

//===================================================================

test('add mutation commits its response before supporting-resource refresh and reconciles ambiguous failures', async () => {
  const source = await readDetails();

  const addStart = source.indexOf(
    'const handleAddProductConfirm = async () =>'
  );

  const removeStart = source.indexOf(
    'const handleRemoveProductConfirm = async () =>',
    addStart
  );

  const addSource = source.slice(addStart, removeStart);

  assert.match(
    addSource,
    /const response = await addProductToMyPharmacy\(product\.id\)/
  );

  assert.match(addSource, /setProduct\(response\.product\)/);
  assert.doesNotMatch(addSource, /getProductStockMovements/);

  assert.match(addSource, /shouldReconcileProductMutation\(addError, 'add'\)/);
  assert.match(source, /error\.transportCode === 'INVALID_RESPONSE'/);
  assert.match(source, /error\.httpStatus >= 500/);

  assert.match(
    addSource,
    /const latest = await getProductDetails\(product\.id\)/
  );

  assert.match(
    addSource,
    /getProductOffer\(latest\.product, currentPharmacyId\)/
  );

  assert.match(
    addSource,
    /toast\.success\('Product is already added to your pharmacy\.'\)/
  );
});
