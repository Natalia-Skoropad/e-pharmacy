import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('Own products displays Product ID before Product article, like All products', async () => {
  const table = await read(
    'src/components/products/OwnProductsTable/OwnProductsTable.tsx'
  );

  const photoPosition = table.indexOf("key: 'productPhoto'");
  const idPosition = table.indexOf("key: 'productId'");
  const articlePosition = table.indexOf("key: 'article'");

  assert.ok(photoPosition >= 0 && photoPosition < idPosition);
  assert.ok(idPosition < articlePosition);

  assert.match(
    table,
    /key: 'productId',[\s\S]*?width: '126px',[\s\S]*?\['Product', 'ID'\]/
  );

  assert.match(
    table,
    /key: 'productId',[\s\S]*?className=\{css\.breakableLink\}[\s\S]*?\{product\.id\}/
  );
});

//===================================================================

test('Product ID link follows the same all-pharmacies / selected-pharmacy routing as article', async () => {
  const table = await read(
    'src/components/products/OwnProductsTable/OwnProductsTable.tsx'
  );

  const idColumn = table.slice(
    table.indexOf("key: 'productId'"),
    table.indexOf("key: 'article'")
  );

  assert.match(
    idColumn,
    /isAllPharmacies\s*\? getPharmacyAllProductPath\(product\.id\)/
  );

  assert.match(idColumn, /: getPharmacyProductPath\(product\.id\)/);

  const css = await read(
    'src/components/products/OwnProductsTable/OwnProductsTable.module.css'
  );

  assert.match(css, /\.breakableLink\s*\{[^}]*overflow-wrap:\s*anywhere/);
});
