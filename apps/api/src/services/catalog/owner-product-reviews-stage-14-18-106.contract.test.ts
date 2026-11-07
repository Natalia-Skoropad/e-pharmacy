import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('owner product reviews enforce ownerCatalog in the existing authenticated management scope', async () => {
  const [service, controller, routes] = await Promise.all([
    read('src/services/catalog/product-reviews.service.ts'),
    read('src/controllers/catalog/product.controller.ts'),
    read('src/routes/catalog/product.routes.ts'),
  ]);

  assert.match(
    service,
    /getManagedProductDetailsService\(productId, actor, ownerCatalog\)/
  );

  assert.match(
    controller,
    /getManagedProductReviewsService\([\s\S]*?req\.query\.ownerCatalog === 'true'/
  );

  assert.match(
    routes,
    /'\/management\/:productId\/reviews'[\s\S]*authenticate[\s\S]*authorizeRoles/
  );
});
