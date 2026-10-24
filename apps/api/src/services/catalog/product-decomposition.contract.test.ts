import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const modules = [
  'product-public.service.ts',
  'product-management.service.ts',
  'product-reviews.service.ts',
  'product-projections.ts',
  'product-shared.ts',
  'product-management-access.ts',
] as const;

const root = resolve(process.cwd(), 'src/services/catalog');
const load = (name: string) => readFile(resolve(root, name), 'utf8');

//===================================================================

test('S10 Product has no legacy proxy; controller imports canonical modules directly', async () => {
  await assert.rejects(access(resolve(root, 'product.service.ts')), {
    code: 'ENOENT',
  });

  const controller = await readFile(
    resolve(process.cwd(), 'src/controllers/catalog/product.controller.ts'),
    'utf8'
  );

  assert.doesNotMatch(controller, /catalog\/product\.service['"]/);

  for (const name of [
    'product-public.service',
    'product-management.service',
    'product-reviews.service',
  ]) {
    assert.match(
      controller,
      new RegExp(`catalog/${name.replaceAll('.', '\\.')}['"]`)
    );
  }

  for (const name of modules) {
    const source = await load(name);

    assert.doesNotMatch(source, /^export\s*\{[^}]+\}\s*from\s*['"]/m);

    assert.match(
      source,
      /(?:export )?(?:async )?function|(?:export )?(?:const|type)/
    );
  }
});

//===================================================================

test('S10 Product domain graph is acyclic and has no missing relative imports', async () => {
  const nodes = new Map<string, string>();

  for (const name of modules) nodes.set(name, await load(name));

  const visited = new Set<string>();
  const active = new Set<string>();

  const walk = (name: string) => {
    assert.ok(!active.has(name), `Product module cycle at ${name}`);

    if (visited.has(name)) return;

    active.add(name);

    const source = nodes.get(name);

    assert.ok(source, `Missing module ${name}`);

    for (const match of source.matchAll(
      /from\s+['"](\.\/product-[^'"]+)['"]/g
    )) {
      const candidate = `${match[1]!.slice(2)}.ts`;

      assert.ok(
        existsSync(resolve(root, candidate)),
        `Missing local module ${candidate}`
      );

      if (nodes.has(candidate)) walk(candidate);
    }

    active.delete(name);
    visited.add(name);
  };

  for (const name of modules) walk(name);

  assert.equal(visited.size, modules.length);
});

//===================================================================

test('S10 Product keeps offer projections private and mutations transactional', async () => {
  const [projections, shared, management, accessControl] = await Promise.all([
    load('product-projections.ts'),
    load('product-shared.ts'),
    load('product-management.service.ts'),
    load('product-management-access.ts'),
  ]);

  assert.match(
    projections,
    /canSeeOperationalFields[\s\S]*?totalQuantity:[\s\S]*?reservedQuantity:/
  );

  assert.match(
    projections,
    /visibility\.mode === 'public'[\s\S]*?pharmacyFilter\.status/
  );

  assert.match(shared, /scope === 'public' \? 'active'/);
  assert.match(shared, /getOfferSummaryByProductIds/);

  assert.match(
    accessControl,
    /requirePharmacyCapability\(\s*userId,\s*'read_products'/
  );

  assert.match(
    accessControl,
    /requirePharmacyCapability\(userId, 'manage_products'\)/
  );

  assert.match(
    accessControl,
    /assertCurrentPharmacyScope\(query\.pharmacyId, currentPharmacyId\)/
  );

  const add = management.split(
    'export async function addProductToMyPharmacyService'
  )[1]!;

  const remove = management.split(
    'export async function removeProductFromMyPharmacyService'
  )[1]!;

  assert.match(
    add.split('export async function removeProductFromMyPharmacyService')[0]!,
    /session\.withTransaction[\s\S]*?recordInitialStockArrival/
  );

  assert.match(add, /isDuplicateProductOfferError/);

  assert.match(
    remove,
    /session\.withTransaction[\s\S]*?Order\.exists[\s\S]*?ProductOffer\.deleteOne/
  );
});

//===================================================================

test('S10 Product preserves review uniqueness and moderated rating updates', async () => {
  const source = await load('product-reviews.service.ts');

  assert.match(
    source,
    /getManagedProductReviewsService[\s\S]*?getManagedProductDetailsService/
  );

  assert.match(source, /isDuplicateProductReviewError/);
  assert.match(source, /REVIEW_ERROR_CODES\.ALREADY_SUBMITTED/);
  assert.match(source, /status: 'on_moderation'/);
  assert.match(source, /ProductReview\.findOneAndUpdate/);

  assert.match(
    source,
    /Product\.updateOne\([\s\S]*?reviewsCount: approved\.length/
  );
});
