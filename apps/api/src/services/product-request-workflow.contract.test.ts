import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('active product request articles have a storage-level uniqueness backstop', async () => {
  const [model, service] = await Promise.all([
    readFile(
      resolve(process.cwd(), 'src/models/productRequest.model.ts'),
      'utf8'
    ),

    readFile(
      resolve(process.cwd(), 'src/services/product-request.service.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    model,
    /index\([\s\S]*?\{ article: 1 \}[\s\S]*?unique: true[\s\S]*?partialFilterExpression[\s\S]*?'draft'[\s\S]*?'new'[\s\S]*?'in_progress'[\s\S]*?'approved'/
  );

  assert.match(service, /isDuplicateProductRequestArticleError/);
  assert.match(service, /PRODUCT_REQUEST_ERROR_CODES\.ARTICLE_CONFLICT/);
});

//===================================================================

test('admin moderation endpoint owns the request transition graph and approved product relation', async () => {
  const [routes, service] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/routes/admin.routes.ts'), 'utf8'),
    readFile(
      resolve(process.cwd(), 'src/services/product-request.service.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    routes,
    /adminRoutes\.use\(authenticate, authorizeRoles\(USER_ROLES\.ADMIN\)\)/
  );

  assert.match(routes, /'\/product-requests\/:requestId\/status'/);
  assert.match(routes, /productRequestModerationSchema/);

  assert.match(
    service,
    /currentStatus === 'new'[\s\S]*?nextStatus === 'in_progress'/
  );

  assert.match(
    service,
    /currentStatus === 'in_progress'[\s\S]*?nextStatus === 'approved'[\s\S]*?nextStatus === 'rejected'/
  );

  assert.match(service, /mongoose\.startSession\(\)/);
  assert.match(service, /session\.withTransaction/);
  assert.match(service, /resolveApprovedProductId/);
  assert.match(service, /request\.productId = approvedProductId/);
  assert.match(service, /request\.history = \[/);
});
