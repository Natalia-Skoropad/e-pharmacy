import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const requiredFiles = [
  [
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'product-categories',
    'route.ts',
  ],
  [
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'product-categories',
    '[categoryId]',
    'route.ts',
  ],
  ['apps', 'admin', 'src', 'app', 'api', 'admin', 'positions', 'route.ts'],
  [
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'positions',
    '[positionId]',
    'route.ts',
  ],
  [
    'apps',
    'admin',
    'src',
    'lib',
    'api',
    'browser',
    'admin-product-categories.api.ts',
  ],
  ['apps', 'admin', 'src', 'lib', 'api', 'browser', 'admin-positions.api.ts'],
  [
    'apps',
    'admin',
    'src',
    'components',
    'settings',
    'SettingsDictionary',
    'SettingsDictionaryPage.tsx',
  ],
  [
    'apps',
    'admin',
    'src',
    'components',
    'settings',
    'SettingsDictionary',
    'SettingsDictionaryFormModal.tsx',
  ],
  ['packages', 'ui', 'src', 'forms', 'ColorPicker', 'ColorPicker.tsx'],
  [
    'apps',
    'admin',
    'src',
    'app',
    'admin',
    'settings',
    'categories',
    'page.tsx',
  ],
  ['apps', 'admin', 'src', 'app', 'admin', 'settings', 'positions', 'page.tsx'],
  [
    'apps',
    'admin',
    'src',
    'components',
    'settings',
    'ProductCategoriesSettings',
    'ProductCategoriesSettings.tsx',
  ],
  [
    'apps',
    'admin',
    'src',
    'components',
    'settings',
    'PositionsSettings',
    'PositionsSettings.tsx',
  ],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(...file),
    true,
    `Admin Settings file must exist: ${file.join('/')}`
  );
}

//===================================================================

const productCategoriesBff = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'admin',
  'product-categories',
  'route.ts'
);

const positionsBff = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'admin',
  'positions',
  'route.ts'
);

for (const source of [productCategoriesBff, positionsBff]) {
  assert.match(source, /createPrivateProxyRoute/);
  assert.match(source, /method:\s*'GET'/);
  assert.match(source, /method:\s*'POST'/);
}

const productCategoriesBrowser = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'browser',
  'admin-product-categories.api.ts'
);

const positionsBrowser = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'browser',
  'admin-positions.api.ts'
);

for (const source of [productCategoriesBrowser, positionsBrowser]) {
  assert.match(source, /import 'client-only'/);
  assert.match(source, /localApiRequest/);
  assert.match(source, /appendQueryParams/);
  assert.match(source, /responseType:\s*'no-content'/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_API_URL|API_URL/);
}

const page = await read(
  'apps',
  'admin',
  'src',
  'components',
  'settings',
  'SettingsDictionary',
  'SettingsDictionaryPage.tsx'
);

for (const token of [
  'PageHeader',
  'SearchInput',
  'FiltersButton',
  'RowsPerPageSelect',
  'CountLabel',
  'DataTable',
  'PaginationView',
  'ConfirmationModal',
  'SettingsDictionaryFormModal',
]) {
  assert.match(page, new RegExp(`\\b${token}\\b`));
}

assert.match(page, /config\.color/);
assert.match(page, /usage\.total/);
assert.match(page, /canAdmin/);
assert.match(page, /config\.pageIcon/);
assert.match(page, /config\.infoItems/);
assert.match(page, /config\.addLabel/);
assert.match(page, /minWidth=\{config\.color \? 900 : 840\}/);

const formModal = await read(
  'apps',
  'admin',
  'src',
  'components',
  'settings',
  'SettingsDictionary',
  'SettingsDictionaryFormModal.tsx'
);

assert.match(formModal, /ColorPicker/);
assert.match(formModal, /buildReferenceDataNameError/);
assert.match(formModal, /isProductCategoryColor/);
assert.match(formModal, /defaultColor \?/);

const colorPicker = await read(
  'packages',
  'ui',
  'src',
  'forms',
  'ColorPicker',
  'ColorPicker.tsx'
);

assert.doesNotMatch(colorPicker, /type="color"/);
assert.match(colorPicker, /customPalette/);
assert.match(colorPicker, /type="range"/);
assert.match(colorPicker, /normalizeProductCategoryColor/);
assert.match(colorPicker, /aria-invalid/);
assert.match(colorPicker, /COLOR_PRESETS/);
assert.match(colorPicker, /More colors/);

const categoryModel = await read(
  'apps',
  'api',
  'src',
  'models',
  'productCategory.model.ts'
);

const categorySchema = await read(
  'apps',
  'api',
  'src',
  'schemas',
  'admin-settings.schema.ts'
);

assert.match(categoryModel, /color:/);
assert.match(categoryModel, /PRODUCT_CATEGORY_COLOR_PATTERN/);
assert.match(categorySchema, /createAdminProductCategorySchema/);
assert.match(categorySchema, /productCategoryColorSchema/);

//===================================================================

const categoriesRoutePage = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'settings',
  'categories',
  'page.tsx'
);

const positionsRoutePage = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'settings',
  'positions',
  'page.tsx'
);

assert.match(categoriesRoutePage, /AdminPermissionGate/);
assert.match(categoriesRoutePage, /ADMIN_PERMISSIONS\.categories\.view/);
assert.match(categoriesRoutePage, /ProductCategoriesSettings/);

assert.match(positionsRoutePage, /AdminPermissionGate/);
assert.match(positionsRoutePage, /ADMIN_PERMISSIONS\.positions\.view/);
assert.match(positionsRoutePage, /PositionsSettings/);

const categoriesSettings = await read(
  'apps',
  'admin',
  'src',
  'components',
  'settings',
  'ProductCategoriesSettings',
  'ProductCategoriesSettings.tsx'
);

for (const token of [
  'SettingsDictionaryPage',
  'getAdminProductCategories',
  'createAdminProductCategory',
  'updateAdminProductCategory',
  'deleteAdminProductCategory',
  'ADMIN_PERMISSIONS.categories.create',
  'ADMIN_PERMISSIONS.categories.edit',
  'ADMIN_PERMISSIONS.categories.delete',
  'Add category',
  'productsCount',
  'productRequestsCount',
]) {
  assert.match(categoriesSettings, new RegExp(token.replaceAll('.', '\\.')));
}

const positionsSettings = await read(
  'apps',
  'admin',
  'src',
  'components',
  'settings',
  'PositionsSettings',
  'PositionsSettings.tsx'
);

for (const token of [
  'SettingsDictionaryPage',
  'getAdminPositions',
  'createAdminPosition',
  'updateAdminPosition',
  'deleteAdminPosition',
  'ADMIN_PERMISSIONS.positions.create',
  'ADMIN_PERMISSIONS.positions.edit',
  'ADMIN_PERMISSIONS.positions.delete',
  'Add position',
  'employeesCount',
]) {
  assert.match(positionsSettings, new RegExp(token.replaceAll('.', '\\.')));
}

assert.doesNotMatch(positionsSettings, /ColorPicker|defaultColor|color:/);

console.log('Admin Settings CRUD pages structural checks passed.');
