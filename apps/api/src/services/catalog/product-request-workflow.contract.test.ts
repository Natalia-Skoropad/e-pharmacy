import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('active product request articles have a storage-level uniqueness backstop', async () => {
  const [model, service] = await Promise.all([
    readFile(
      resolve(process.cwd(), 'src/models/catalog/productRequest.model.ts'),
      'utf8'
    ),

    readFile(
      resolve(
        process.cwd(),
        'src/services/catalog/product-request-management.service.ts'
      ),
      'utf8'
    ),
  ]);

  assert.match(
    model,
    /index\([\s\S]*?\{ article: 1 \}[\s\S]*?unique: true[\s\S]*?partialFilterExpression[\s\S]*?'new'[\s\S]*?'on_moderation'[\s\S]*?'approved'/
  );

  assert.match(service, /isDuplicateProductRequestArticleError/);
  assert.match(service, /PRODUCT_REQUEST_ERROR_CODES\.ARTICLE_CONFLICT/);
});

//===================================================================

test('admin moderation endpoint owns the request transition graph and approved product relation', async () => {
  const [routes, service] = await Promise.all([
    readFile(
      resolve(process.cwd(), 'src/routes/admin/admin.routes.ts'),
      'utf8'
    ),

    readFile(
      resolve(
        process.cwd(),
        'src/services/catalog/product-request-moderation.service.ts'
      ),
      'utf8'
    ),
  ]);

  assert.match(
    routes,
    /adminRoutes\.use\([\s\S]*?authenticate,[\s\S]*?authorizeRoles\(USER_ROLES\.ADMIN\),[\s\S]*?resolveAdminAuthorization[\s\S]*?\);/
  );

  assert.match(
    routes,
    /'\/product-requests\/:requestId\/status'[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.productRequests\.moderate\)[\s\S]*?productRequestModerationSchema/
  );

  assert.match(
    service,
    /currentStatus === 'on_moderation'[\s\S]*?!reviewState/
  );

  assert.match(
    service,
    /nextStatus === 'approved'[\s\S]*?nextStatus === 'rejected'/
  );

  assert.match(service, /mongoose\.startSession\(\)/);
  assert.match(service, /session\.withTransaction/);
  assert.match(service, /resolveApprovedProduct/);
  assert.match(service, /request\.productId = approvedProduct\.productId/);

  assert.match(
    service,
    /request\.categoryMode === 'custom'[\s\S]*?request\.categoryId = approvedProduct\.categoryId/
  );

  assert.match(service, /requireProductCategoryById/);
  assert.match(service, /request\.history = \[/);
});

//===================================================================

test('demo characteristics backfill applies only missing fields to both collections', async () => {
  const source = await readFile(
    resolve(
      process.cwd(),
      'src/scripts/migrations/catalog/backfill-demo-product-characteristics.ts'
    ),
    'utf8'
  );

  // Both collections must pass through the field projection. Sending the
  // whole fixture includes an existing manufacturer and makes the atomic
  // optimistic filter match zero documents even when attributes are missing.
  assert.equal(
    (source.match(/missingAttributes\(doc, fixture\)/g) ?? []).length,
    2
  );

  assert.match(
    source,
    /updateIfMissing\([\s\S]*?Product\.collection,[\s\S]*?doc,[\s\S]*?missingAttributes\(doc, fixture\),[\s\S]*?products[\s\S]*?\)/
  );

  assert.match(
    source,
    /updateIfMissing\([\s\S]*?ProductRequest\.collection[\s\S]*?missingAttributes\(doc, fixture\),[\s\S]*?requests[\s\S]*?\)/
  );

  assert.match(source, /\{ _id: entry\._id, \$and: conditions \}/);
  assert.match(source, /\{ \$set: fields \}/);
  assert.doesNotMatch(source, /deleteMany|dropCollection|replaceOne/);
});

//===================================================================

test('supporting documents use owner-scoped binary storage and transactional attachment references', async () => {
  const read = async (relative: string) =>
    readFile(resolve(process.cwd(), relative), 'utf8');

  const [fileModel, fileService, writer, migration, routes, schema] =
    await Promise.all([
      read('src/models/catalog/productRequestDocumentFile.model.ts'),
      read('src/services/catalog/product-request-document.service.ts'),
      read('src/services/catalog/product-request-management.service.ts'),

      read(
        'src/scripts/migrations/catalog/migrate-product-request-documents.ts'
      ),

      read('src/routes/catalog/product-request.routes.ts'),
      read('src/schemas/catalog/product-request.schema.ts'),
    ]);

  assert.match(
    fileModel,
    /content:\s*\{[\s\S]*?type: Buffer[\s\S]*?select: false/
  );

  assert.match(
    fileModel,
    /index\(\{ expiresAt: 1 \}, \{ expireAfterSeconds: 0 \}\)/
  );

  assert.match(fileService, /decodeAndVerifyDocumentUpload/);
  assert.match(fileService, /ownerId,[\s\S]*?requestId/);
  assert.match(fileService, /requestId: \{ \$exists: false \}/);
  assert.match(fileService, /select\('\+content'\)/);
  assert.match(writer, /session\.withTransaction/);
  assert.match(writer, /resolveProductRequestDocuments/);
  assert.match(writer, /reconcileProductRequestDocuments/);
  assert.match(writer, /ProductRequestDocumentFile\.deleteMany/);

  assert.match(
    routes,
    /'\/documents'[\s\S]*?authorizeRoles\(USER_ROLES\.PHARMACY\)/
  );

  assert.match(schema, /documentId: mongoIdSchema\.optional\(\)/);
  assert.match(migration, /process\.argv\.includes\('--apply'\)/);
  assert.match(migration, /session\.withTransaction/);
});
