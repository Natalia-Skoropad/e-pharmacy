import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const apiSource = (...parts: string[]) =>
  resolve(process.cwd(), 'src', ...parts);

//===================================================================

test('14.18.15: clientId must not replace the authenticated customer order scope', async () => {
  const source = await readFile(
    apiSource('services', 'orders', 'order-query.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /query\.clientId\s*&&\s*role\s*!==\s*USER_ROLES\.PHARMACY\s*&&\s*query\.clientId\.toLowerCase\(\)\s*!==\s*userId\.toLowerCase\(\)[\s\S]*?HTTP_STATUS\.FORBIDDEN/
  );

  assert.match(
    source,
    /if\s*\(query\.clientId\s*&&\s*role\s*===\s*USER_ROLES\.PHARMACY\)\s*\{[\s\S]*?filter\.userId\s*=\s*clientObjectId/
  );
});

//===================================================================

test('14.18.15: explicit pharmacy order filter cannot disagree with selected membership', async () => {
  const source = await readFile(
    apiSource('services', 'orders', 'order-query.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /query\.pharmacyId\s*&&\s*query\.pharmacyId\.toLowerCase\(\)\s*!==\s*String\(pharmacyId\)[\s\S]*?HTTP_STATUS\.FORBIDDEN/
  );

  assert.match(source, /filter\.pharmacyId\s*=\s*pharmacyId/);
});

//===================================================================

test('14.18.15: stock history enriches order metadata only from the offer pharmacy', async () => {
  const source = await readFile(
    apiSource('services', 'inventory', 'stock-movement-read.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /Order\.find\(\{\s*_id:\s*\{\s*\$in:\s*orderIds\s*\},\s*pharmacyId:\s*currentOffer\.pharmacyId/
  );
});

//===================================================================

test('Order suggestions are tenant-scoped and use server-side paging', async () => {
  const source = await readFile(
    apiSource('services', 'orders', 'order-query.service.ts'),
    'utf8'
  );

  assert.match(source, /getOwnerOrderOptionsService/);
  assert.match(source, /getOwnerOrderPharmacyIds\(userId\)/);
  assert.match(source, /query\.pharmacyId[\s\S]*?HTTP_STATUS\.FORBIDDEN/);
  assert.match(source, /\$in: pharmacyIds/);
  assert.match(source, /\.skip\(\(query\.page - 1\) \* query\.perPage\)/);
  assert.match(source, /\.limit\(query\.perPage\)/);
  assert.match(source, /createOrderClientSearchCondition\(search\)/);
  assert.match(source, /timezone: 'Europe\/Kyiv'/);
  assert.match(source, /isDefaultPharmacyClient defaultClientPharmacyId/);
  assert.match(source, /\.select\('_id name imageUrl'\)/);
  assert.match(source, /allowedIds\.has\(id\)/);
  assert.match(source, /Walk-in client \(\$\{walkInPharmacy\.name\}\)/);
});

//===================================================================

// Options for a product's Related orders must never include an unrelated order
// even if that order belongs to an authorized pharmacy.
test('owner order options also respect the requested product', async () => {
  const query = await readFile(
    apiSource('services', 'orders', 'order-query.service.ts'),
    'utf8'
  );

  const schema = await readFile(
    apiSource('schemas', 'orders', 'order.schema.ts'),
    'utf8'
  );

  assert.match(
    schema,
    /ownerOrderOptionsQuerySchema = z\.object\(\{[\s\S]*?productId: mongoIdSchema\.optional\(\)/
  );

  assert.match(
    query,
    /if \(query\.productId\) filter\['items\.productId'\] = new Types\.ObjectId\(query\.productId\)/
  );
});
