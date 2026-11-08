import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (file: string) => readFile(resolve(process.cwd(), file), 'utf8');

//===============================================================

test('client purchase suggestions are filtered AFTER the successful-order owner-scoped aggregation', async () => {
  const [service, pipeline, schema] = await Promise.all([
    read('src/services/clients/client-purchases.service.ts'),
    read('src/services/clients/client-purchases-aggregation.ts'),
    read('src/schemas/clients/client.schema.ts'),
  ]);

  assert.match(service, /getClientByIdService\(userId, clientId, true\)/);
  assert.match(service, /getOwnedClientPharmacyIds\(userId\)/);
  assert.match(pipeline, /status: 'successful'/);
  assert.match(pipeline, /query\.keyword\?\.trim\(\)/);

  assert.match(
    pipeline,
    /match\.\$or = \[\{ id: keyword \}, \{ name: keyword \}, \{ article: keyword \}\]/
  );

  assert.match(schema, /keyword: sharedSearchSchema/);

  assert.match(
    schema.slice(schema.indexOf('clientProductsQuerySchema')),
    /status: z\.enum\(\['active', 'blocked'\]\)/
  );
});
