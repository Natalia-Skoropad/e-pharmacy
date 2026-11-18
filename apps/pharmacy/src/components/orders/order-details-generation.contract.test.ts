import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

const DETAILS_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.tsx'
);

const ORDER_ROUTE_SOURCE = path.resolve(
  CURRENT_DIR,
  '../../app/pharmacy/orders/[orderId]/page.tsx'
);

const FILTER_ROUTE_SOURCE = path.resolve(
  CURRENT_DIR,
  '../../app/pharmacy/orders/[[...filters]]/page.tsx'
);

//===================================================================

test('order A to B navigation remounts the details resource and resets transient UI state', async () => {
  const [detailsSource, orderRouteSource, filterRouteSource] =
    await Promise.all([
      readFile(DETAILS_SOURCE, 'utf8'),
      readFile(ORDER_ROUTE_SOURCE, 'utf8'),
      readFile(FILTER_ROUTE_SOURCE, 'utf8'),
    ]);

  assert.match(orderRouteSource, /redirect\(getPharmacyOrderPath\(orderId\)\)/);
  assert.match(filterRouteSource, /const orderId = segments\?\.length === 1/);
  assert.match(filterRouteSource, /!isValidObjectId\(orderId\)/);
  assert.match(filterRouteSource, /notFound\(\)/);

  assert.match(
    filterRouteSource,
    /redirect\(getPharmacyOrderPath\(orderId\)\)/
  );

  for (const initialState of [
    /useState<PharmacyOrderDetails \| null>\(null\)/,
    /useState<OrderTab>\('products'\)/,
    /useState<PendingStatusChange \| null>\(null\)/,
    /useState\(''\)/,
    /useState\(false\)/,
    /useState<PharmacyOrderItem \| null>\(null\)/,
    /useState<PendingPriceQuantityChange \| null>\(null\)/,
    /useRef<CreateOrderRequestState \| null>\(null\)/,
  ]) {
    assert.match(detailsSource, initialState);
  }

  assert.doesNotMatch(
    detailsSource,
    /useEffect\(\(\) => \{[\s\S]{0,500}setOrder\(null\)/,
    'Resource reset must come from keyed remount/default state, not synchronous effect state writes'
  );
});

//===================================================================

test('stale detail and mutation responses are generation-isolated', async () => {
  const source = await readFile(DETAILS_SOURCE, 'utf8');

  assert.match(source, /const resourceGenerationRef = useRef\(0\)/);

  assert.match(
    source,
    /const generation = resourceGenerationRef\.current \+ 1;[\s\S]{0,100}resourceGenerationRef\.current = generation/
  );

  assert.match(
    source,
    /controller\.abort\(\);[\s\S]{0,180}resourceGenerationRef\.current \+= 1/
  );

  const staleGuards =
    source.match(/resourceGenerationRef\.current !== generation/g) ?? [];

  assert.ok(
    staleGuards.length >= 4,
    'Expected generation guards for detail load and mutations'
  );

  assert.match(
    source,
    /updatePharmacyOrder\(order\.id, payload\)[\s\S]{0,140}resourceGenerationRef\.current !== generation/
  );

  assert.match(
    source,
    /updatePharmacyOrderStatus\(order\.id, payload\)[\s\S]{0,140}resourceGenerationRef\.current !== generation/
  );

  assert.match(
    source,
    /createPharmacyOrder\([\s\S]{0,220}resourceGenerationRef\.current !== generation/
  );
});

//===================================================================

test('detail tabs preserve header and tab skeletons; only comments omit duplicate content loader', async () => {
  const [detailsSource, skeleton] = await Promise.all([
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(
      path.join(
        path.dirname(DETAILS_SOURCE),
        'OrderDetailsLoadingSkeleton.tsx'
      ),
      'utf8'
    ),
  ]);

  assert.match(
    detailsSource,
    /if \(isLoading\)[\s\S]{0,400}<OrderDetailsLoadingSkeleton tab=\{activeTab\}/
  );

  assert.match(skeleton, /css\.orderHeaderSkeleton/);
  assert.match(skeleton, /css\.skeletonTabs/);
  assert.match(skeleton, /Array\.from\(\{ length: 5 \}/);

  assert.match(
    skeleton,
    /tab !== 'comment' \? \([\s\S]*?<ProfileResourceState/
  );
});

//===================================================================

test('order-specific BFF actions do not rely on a tab-local selected pharmacy', async () => {
  const source = await readFile(
    path.resolve(CURRENT_DIR, '../../lib/api/browser/orders.api.ts'),
    'utf8'
  );

  // New orders carry the pharmacy encoded in the create-page URL, while
  // persisted orders use resource-ID authorization on the backend.
  const creation = source
    .split('export async function createPharmacyOrder(')[1]!
    .split('export async function getPharmacyOrders(')[0]!;

  assert.match(creation, /await ownerLocalApiRequest\(/);
  assert.match(creation, /headers: \{ 'X-Pharmacy-ID': pharmacyId \}/);
  assert.doesNotMatch(creation, /await localApiRequest\(/);

  for (const name of [
    'getPharmacyOrderDetails',
    'updatePharmacyOrder',
    'updatePharmacyOrderStatus',
    'getPharmacyOrderComments',
    'createPharmacyOrderComment',
    'deletePharmacyOrderComment',
  ]) {
    const body = source.split(`export async function ${name}(`)[1]!;

    assert.ok(body, `${name} must exist`);

    const untilNextExport = body.split('\nexport ')[0]!;

    assert.match(untilNextExport, /await ownerLocalApiRequest\(/, name);
    assert.doesNotMatch(untilNextExport, /await localApiRequest\(/, name);
  }
});
