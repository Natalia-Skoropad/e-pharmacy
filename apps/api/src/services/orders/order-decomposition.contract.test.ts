import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const sourceRoot = resolve(process.cwd(), 'src');
const read = (file: string) => readFileSync(resolve(sourceRoot, file), 'utf8');

const orderModuleNames = [
  'order-access',
  'order-checkout.service',
  'order-comments.service',
  'order-manager-orders.service',
  'order-mutations.service',
  'order-query.service',
  'order-sales-statistics.service',
  'order-shared',
  'order-status',
] as const;

const modules = new Map<string, string>(
  orderModuleNames.map((name): [string, string] => [
    name,
    read(`services/orders/${name}.ts`),
  ])
);

//===================================================================

test('S10 Order has no legacy service, proxy or barrel, and controllers use canonical modules', () => {
  assert.equal(
    existsSync(resolve(sourceRoot, 'services/orders/order.service.ts')),
    false
  );

  for (const [name, source] of modules) {
    assert.doesNotMatch(source, /^export\s+(?:\*|\{[^}]+\})\s+from\s+/m, name);
  }

  const controller = read('controllers/order.controller.ts');

  assert.doesNotMatch(controller, /orders\/order\.service/);

  for (const name of [
    'order-checkout.service',
    'order-manager-orders.service',
    'order-mutations.service',
    'order-comments.service',
    'order-query.service',
    'order-sales-statistics.service',
  ]) {
    assert.match(
      controller,
      new RegExp(`orders/${name.replaceAll('.', '\\.')}['"]`)
    );
  }
});

//===================================================================

test('S10 Order shared modules have an acyclic import graph and no missing local modules', () => {
  const graph = new Map<string, string[]>();

  for (const [name, source] of modules) {
    const neighbors = [...source.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)]
      .map((match) => match[1])
      .filter((target) => modules.has(target));

    graph.set(name, neighbors);

    for (const match of source.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)) {
      assert.ok(
        existsSync(resolve(sourceRoot, `services/orders/${match[1]}.ts`)),
        `${name}: ${match[1]}`
      );
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(name: string): void {
    assert.ok(!visiting.has(name), `Circular order import: ${name}`);

    if (visited.has(name)) return;

    visiting.add(name);

    for (const next of graph.get(name) ?? []) visit(next);

    visiting.delete(name);
    visited.add(name);
  }

  for (const name of graph.keys()) visit(name);
});

//===================================================================

test('S10 Order retains checkout, manager, stock mutation and comment transaction boundaries', () => {
  const checkout = modules.get('order-checkout.service')!;
  const manager = modules.get('order-manager-orders.service')!;
  const mutations = modules.get('order-mutations.service')!;
  const comments = modules.get('order-comments.service')!;

  for (const [name, source, count] of [
    ['checkout', checkout, 1],
    ['manager', manager, 1],
    ['mutations', mutations, 2],
    ['comments', comments, 2],
  ] as const) {
    assert.equal(
      (source.match(/session\.withTransaction\(/g) ?? []).length,
      count,
      name
    );

    assert.match(source, /mongoose\.startSession\(/, name);
    assert.match(source, /session\.endSession\(/, name);
  }

  assert.match(checkout, /expectedCartRevision/);
  assert.match(checkout, /groupFingerprint/);
  assert.match(checkout, /reserveOfferStock/);
  assert.match(manager, /managerRequestFingerprint/);
  assert.match(manager, /MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE/);

  for (const action of [
    'reserveOfferStock',
    'releaseOfferStock',
    'commitReservedStock',
  ]) {
    assert.match(mutations, new RegExp(action));
  }

  assert.match(comments, /clientRequestId/);
  assert.match(comments, /assertCanEditPharmacyOrder/);
});

//===================================================================

test('S10 Order keeps tenant capability checks separate from shared serialization and sales', () => {
  const access = modules.get('order-access')!;
  const shared = modules.get('order-shared')!;
  const stats = modules.get('order-sales-statistics.service')!;
  const query = modules.get('order-query.service')!;

  assert.match(access, /requirePharmacyCapability\(actor\.id, capability/);
  assert.match(access, /pharmacyId: String\(order\.pharmacyId\)/);
  assert.match(access, /'manage_orders'/);
  assert.match(access, /isPharmacyOperationalStatus/);
  assert.doesNotMatch(shared, /requirePharmacyCapability/);
  assert.match(shared, /const clientSnapshot = order\.clientSnapshot/);
  assert.match(shared, /getOrderPharmacyLocation/);
  assert.match(query, /getCurrentPharmacyId\(userId\)/);
  assert.match(stats, /getOrderSalesStatisticsForPharmaciesService/);
});
