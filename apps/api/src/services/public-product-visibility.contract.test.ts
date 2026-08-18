import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('public product endpoints are active-only while blocked lifecycle access is management-only', async () => {
  const [routes, service, pharmacyService] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/routes/product.routes.ts'), 'utf8'),
    readFile(resolve(process.cwd(), 'src/services/product.service.ts'), 'utf8'),

    readFile(
      resolve(process.cwd(), 'src/services/pharmacy.service.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    routes,
    /productRoutes\.get\(\s*'\/'[\s\S]*?query:\s*publicProductsQuerySchema/
  );

  assert.match(
    routes,
    /productRoutes\.get\(\s*'\/management'[\s\S]*?authenticate[\s\S]*?authorizeRoles\(USER_ROLES\.PHARMACY, USER_ROLES\.ADMIN\)[\s\S]*?managedProductsQuerySchema/
  );

  assert.match(
    service,
    /scope === 'public' \? 'active' : \(query\.status \?\? tableStatusFilter\)/
  );

  assert.match(
    service,
    /status:\s*scope === 'public' \? 'active' : \{ \$in: \['active', 'blocked'\] \}/
  );

  assert.match(service, /getProductReviewsService[\s\S]*?status:\s*'active'/);

  assert.match(
    pharmacyService,
    /const PUBLIC_PHARMACY_STATUSES = \[[\s\S]*?PHARMACY_STATUSES\.ACTIVE[\s\S]*?PHARMACY_STATUSES\.ON_MODERATION[\s\S]*?\] as const/
  );

  assert.match(
    service,
    /getOffersByProductIds[\s\S]*?status:\s*\{ \$in: \['active', 'on_moderation'\] \}/
  );

  assert.match(
    pharmacyService,
    /\$lookup:[\s\S]*?from:\s*Product\.collection\.name[\s\S]*?\$match:\s*\{ 'product\.status': 'active' \}/
  );
});
