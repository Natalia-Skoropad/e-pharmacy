import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findPropertyCallStringArray,
  getStringUnionValues,
  getVariableLiteral,
  loadTypeScript,
  parseTypeScriptFile,
} from './config-source-ast.mjs';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');
const ts = loadTypeScript(ROOT_DIR);

const fromRoot = (...segments) => path.join(ROOT_DIR, ...segments);
const parse = (...segments) => parseTypeScriptFile(ts, fromRoot(...segments));

//===================================================================

function sorted(values) {
  return [...values].sort();
}

//===================================================================

function assertSameValues(label, frontend, backend) {
  assert.deepEqual(
    sorted(frontend),
    sorted(backend),
    `${label} differ between frontend and backend`
  );
}

//===================================================================

const [
  frontendAuth,
  frontendUsers,
  frontendPharmacies,
  frontendProducts,
  frontendCategories,
  frontendProductRequests,
  frontendOrders,
  frontendNotes,
  frontendCart,
  frontendCartLifecycle,
  frontendPresentationOrders,
  frontendPresentationProducts,
  frontendPresentationPharmacies,
  frontendPresentationRequests,
  frontendPresentationUsers,
  backendAuth,
  backendProductModel,
  backendCategories,
  backendProductRequests,
  backendOrders,
  backendNotes,
  backendClientSchema,
  backendCart,
  apiClientCartParser,
  clientFilters,
] = await Promise.all([
  parse('packages', 'config', 'src', 'auth', 'domain-values.ts'),
  parse('packages', 'config', 'src', 'users', 'domain-values.ts'),
  parse('packages', 'config', 'src', 'pharmacies', 'domain-values.ts'),
  parse('packages', 'config', 'src', 'products', 'domain-values.ts'),
  parse('packages', 'config', 'src', 'products', 'categories.ts'),
  parse('packages', 'config', 'src', 'product-requests', 'statuses.ts'),
  parse('packages', 'config', 'src', 'orders', 'domain-values.ts'),
  parse('packages', 'config', 'src', 'notes', 'entity-types.ts'),
  parse('packages', 'config', 'src', 'cart', 'limits.ts'),
  parse('packages', 'config', 'src', 'cart', 'lifecycle.ts'),
  parse('packages', 'config', 'src', 'presentation', 'orders.ts'),
  parse('packages', 'config', 'src', 'presentation', 'products.ts'),
  parse('packages', 'config', 'src', 'presentation', 'pharmacies.ts'),
  parse('packages', 'config', 'src', 'presentation', 'product-requests.ts'),
  parse('packages', 'config', 'src', 'presentation', 'users.ts'),
  parse('apps', 'api', 'src', 'constants', 'auth.ts'),
  parse('apps', 'api', 'src', 'models', 'product.model.ts'),
  parse('apps', 'api', 'src', 'types', 'categories.ts'),
  parse('apps', 'api', 'src', 'constants', 'product-request-validation.ts'),
  parse('apps', 'api', 'src', 'types', 'order.ts'),
  parse('apps', 'api', 'src', 'models', 'pharmacyNote.model.ts'),
  parse('apps', 'api', 'src', 'schemas', 'client.schema.ts'),
  parse('apps', 'api', 'src', 'constants', 'cart.ts'),

  parse('packages', 'api-client', 'src', 'response', 'shared-dto-parsers.ts'),

  parse(
    'apps',
    'pharmacy',
    'src',
    'lib',
    'clients',
    'client-filter-contracts.ts'
  ),
]);

//===================================================================

assertSameValues(
  'Auth applications',
  getVariableLiteral(ts, frontendAuth, 'AUTH_APPLICATIONS'),
  Object.values(getVariableLiteral(ts, backendAuth, 'AUTH_APPLICATIONS'))
);

assertSameValues(
  'User roles',
  getVariableLiteral(ts, frontendAuth, 'USER_ROLES'),
  Object.values(getVariableLiteral(ts, backendAuth, 'USER_ROLES'))
);

assertSameValues(
  'User statuses',
  getVariableLiteral(ts, frontendUsers, 'USER_STATUSES'),
  Object.values(getVariableLiteral(ts, backendAuth, 'USER_STATUSES'))
);

assertSameValues(
  'Pharmacy statuses',
  getVariableLiteral(ts, frontendPharmacies, 'PHARMACY_STATUSES'),
  Object.values(getVariableLiteral(ts, backendAuth, 'PHARMACY_STATUSES'))
);

assertSameValues(
  'Product statuses',
  getVariableLiteral(ts, frontendProducts, 'PRODUCT_STATUSES'),
  getVariableLiteral(ts, backendProductModel, 'PRODUCT_STATUSES')
);

assertSameValues(
  'Product categories',
  getVariableLiteral(ts, frontendCategories, 'PRODUCT_CATEGORIES'),
  getVariableLiteral(ts, backendCategories, 'PRODUCT_CATEGORIES')
);

assert.deepEqual(
  getVariableLiteral(
    ts,
    frontendPresentationProducts,
    'PRODUCT_CATEGORY_LABELS'
  ),

  getVariableLiteral(ts, backendCategories, 'PRODUCT_CATEGORY_LABELS'),
  'Product category labels differ between frontend and backend'
);

assertSameValues(
  'Product request statuses',
  getVariableLiteral(ts, frontendProductRequests, 'PRODUCT_REQUEST_STATUSES'),
  getVariableLiteral(ts, backendProductRequests, 'PRODUCT_REQUEST_STATUSES')
);

for (const [label, frontendName, backendType] of [
  ['Order statuses', 'ORDER_STATUSES', 'OrderStatus'],
  ['Delivery methods', 'DELIVERY_METHODS', 'DeliveryMethod'],
  ['Payment methods', 'PAYMENT_METHODS', 'PaymentMethod'],
  ['Order creator types', 'ORDER_CREATED_BY_TYPES', 'OrderCreatedByType'],
]) {
  assertSameValues(
    label,
    getVariableLiteral(ts, frontendOrders, frontendName),
    getStringUnionValues(ts, backendOrders, backendType)
  );
}

assertSameValues(
  'Pharmacy note entity types',
  getVariableLiteral(ts, frontendNotes, 'PHARMACY_NOTE_ENTITY_TYPES'),
  findPropertyCallStringArray(ts, backendNotes, 'enum')
);

assertSameValues(
  'Client successful-order filters',
  getVariableLiteral(
    ts,
    clientFilters,
    'CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES'
  ),

  findPropertyCallStringArray(ts, backendClientSchema, 'successfulOrders')
);

assert.equal(
  getVariableLiteral(ts, frontendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  getVariableLiteral(ts, backendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  'Cart pharmacy-group limits differ between frontend and backend'
);

const cartItemMaxQuantity = getVariableLiteral(
  ts,
  frontendCart,
  'CART_ITEM_MAX_QUANTITY'
);

assert.equal(
  cartItemMaxQuantity,
  getVariableLiteral(ts, backendCart, 'CART_ITEM_MAX_QUANTITY'),
  'Cart item quantity limits differ between frontend and backend'
);

assert.equal(
  cartItemMaxQuantity,
  getVariableLiteral(ts, apiClientCartParser, 'CART_ITEM_MAX_QUANTITY'),
  'API-client cart parser quantity limit differs from the canonical cart limit'
);

assert.equal(
  getVariableLiteral(ts, frontendCart, 'CART_PHARMACY_LIMIT_ERROR_CODE'),
  getVariableLiteral(ts, backendCart, 'CART_PHARMACY_LIMIT_ERROR_CODE'),
  'Cart pharmacy-limit error codes differ between frontend and backend'
);

assert.equal(
  getVariableLiteral(ts, frontendCartLifecycle, 'CART_ITEM_TTL_DAYS'),
  getVariableLiteral(ts, backendCart, 'CART_ITEM_TTL_DAYS'),
  'Cart item TTL differs between frontend and backend'
);

const frontendCartErrors = await parse(
  'packages',
  'config',
  'src',
  'cart',
  'error-codes.ts'
);

const backendCartErrors = await parse(
  'apps',
  'api',
  'src',
  'constants',
  'cart.ts'
);

const backendStockErrors = await parse(
  'apps',
  'api',
  'src',
  'constants',
  'stock.ts'
);

const frontendCheckoutErrors = await parse(
  'packages',
  'config',
  'src',
  'orders',
  'error-codes.ts'
);
const backendCheckoutErrors = await parse(
  'apps',
  'api',
  'src',
  'constants',
  'order.ts'
);

const frontendOrderTransitions = await parse(
  'packages',
  'config',
  'src',
  'orders',
  'transitions.ts'
);

const backendOrderService = await parse(
  'apps',
  'api',
  'src',
  'services',
  'order.service.ts'
);

assert.equal(
  getVariableLiteral(ts, frontendCartErrors, 'CART_CHANGED_ERROR_CODE'),
  getVariableLiteral(ts, backendCartErrors, 'CART_CHANGED_ERROR_CODE'),
  'CART_CHANGED_ERROR_CODE differs between frontend and backend'
);

assert.equal(
  getVariableLiteral(ts, frontendCartErrors, 'STOCK_CHANGED_ERROR_CODE'),
  getVariableLiteral(ts, backendStockErrors, 'STOCK_CHANGED_ERROR_CODE'),
  'STOCK_CHANGED_ERROR_CODE differs between frontend and backend'
);

for (const errorCodeName of [
  'CHECKOUT_CART_CHANGED_ERROR_CODE',
  'CHECKOUT_GROUP_MISSING_ERROR_CODE',
  'PHARMACY_UNAVAILABLE_ERROR_CODE',
  'PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE',
]) {
  assert.equal(
    getVariableLiteral(ts, frontendCheckoutErrors, errorCodeName),
    getVariableLiteral(ts, backendCheckoutErrors, errorCodeName),
    `${errorCodeName} differs between frontend and backend`
  );
}

assert.deepEqual(
  getVariableLiteral(ts, frontendOrderTransitions, 'ORDER_STATUS_TRANSITIONS'),
  getVariableLiteral(ts, backendOrderService, 'ORDER_STATUS_TRANSITIONS'),
  'Order status transition graphs differ between shared config and backend'
);

//===================================================================

const semanticTones = new Set([
  'info',
  'pending',
  'success',
  'warning',
  'danger',
  'neutral',
]);

for (const [domainValues, presentationFile, presentationName] of [
  [
    getVariableLiteral(ts, frontendOrders, 'ORDER_STATUSES'),
    frontendPresentationOrders,
    'ORDER_STATUS_PRESENTATION',
  ],
  [
    getVariableLiteral(ts, frontendPharmacies, 'PHARMACY_STATUSES'),
    frontendPresentationPharmacies,
    'PHARMACY_STATUS_PRESENTATION',
  ],
  [
    getVariableLiteral(ts, frontendProducts, 'PRODUCT_STATUSES'),
    frontendPresentationProducts,
    'PRODUCT_STATUS_PRESENTATION',
  ],
  [
    getVariableLiteral(ts, frontendProductRequests, 'PRODUCT_REQUEST_STATUSES'),
    frontendPresentationRequests,
    'PRODUCT_REQUEST_STATUS_PRESENTATION',
  ],
  [
    getVariableLiteral(ts, frontendUsers, 'USER_STATUSES'),
    frontendPresentationUsers,
    'USER_STATUS_PRESENTATION',
  ],
]) {
  const presentation = getVariableLiteral(
    ts,
    presentationFile,
    presentationName
  );

  assert.deepEqual(
    sorted(Object.keys(presentation)),
    sorted(domainValues),
    `${presentationName} is not exhaustive`
  );

  for (const item of Object.values(presentation)) {
    assert.equal(
      typeof item.label === 'string' && item.label.trim().length > 0,
      true
    );
    assert.equal(
      semanticTones.has(item.tone),
      true,
      `${presentationName} uses a non-semantic tone`
    );
  }
}

//===================================================================

const [
  cookieNamesSource,
  authSessionSource,
  nextApiCookiesSource,
  backendCartServiceSource,
  backendErrorMiddlewareSource,
  clientCartLimitSource,
  productCategoriesSource,
  categoryOptionsHelperSource,
  clientCategoryConsumerSource,
  pharmacyCategoryConsumerSource,
  clientStatisticsSource,
  orderCopyConsumersSource,
] = await Promise.all([
  readFile(
    fromRoot('packages', 'config', 'src', 'auth', 'cookie-names.ts'),
    'utf8'
  ),

  readFile(fromRoot('packages', 'auth', 'src', 'react.ts'), 'utf8'),

  readFile(
    fromRoot('packages', 'next-api', 'src', 'internal', 'auth-cookies.ts'),
    'utf8'
  ),

  readFile(
    fromRoot('apps', 'api', 'src', 'services', 'cart.service.ts'),
    'utf8'
  ),

  readFile(
    fromRoot('apps', 'api', 'src', 'middlewares', 'error.middleware.ts'),
    'utf8'
  ),

  readFile(
    fromRoot('apps', 'client', 'src', 'lib', 'cart', 'order-limit.ts'),
    'utf8'
  ),

  readFile(
    fromRoot('packages', 'config', 'src', 'products', 'categories.ts'),
    'utf8'
  ),

  readFile(
    fromRoot(
      'packages',
      'utils',
      'src',
      'collections',
      'create-unique-labeled-options.ts'
    ),
    'utf8'
  ),

  readFile(
    fromRoot(
      'apps',
      'client',
      'src',
      'components',
      'cart',
      'ContinueShoppingModal',
      'ContinueShoppingModal.tsx'
    ),
    'utf8'
  ),

  readFile(
    fromRoot(
      'apps',
      'pharmacy',
      'src',
      'components',
      'orders',
      'OrderDetailsPageContent',
      'OrderDetailsPageContent.tsx'
    ),
    'utf8'
  ),

  readFile(
    fromRoot(
      'apps',
      'pharmacy',
      'src',
      'lib',
      'statistics',
      'config',
      'client-statistics.ts'
    ),
    'utf8'
  ),

  Promise.all([
    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'checkout',
        'CheckoutPaymentMethod',
        'CheckoutPaymentMethod.tsx'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'checkout',
        'CheckoutPageContent',
        'CheckoutPageContent.tsx'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'profile',
        'OrderDetailsPageContent',
        'OrderDetailsPageContent.tsx'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'info',
        'config',
        'delivery-payment.ts'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'product-catalog',
        'ProductDetailsPageContent',
        'ProductOrderInfoCard.tsx'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'client',
        'src',
        'components',
        'product-catalog',
        'ProductDetailsPageContent',
        'ProductDetailsPageContent.tsx'
      ),
      'utf8'
    ),

    readFile(
      fromRoot(
        'apps',
        'pharmacy',
        'src',
        'components',
        'orders',
        'OrderDetailsPageContent',
        'OrderDetailsPageContent.tsx'
      ),
      'utf8'
    ),
  ]).then((sources) => sources.join('\n')),
]);

assert.doesNotMatch(cookieNamesSource, /AUTH_READY_COOKIE_MAX_AGE_SECONDS/);

assert.doesNotMatch(
  authSessionSource,
  /setBrowserAuthSessionHint|clearBrowserAuthSessionHint|browserAuthSessionHintStorage/
);

assert.match(nextApiCookiesSource, /maxAge:\s*tokens\.refreshTokenExpiresIn/);
assert.match(backendCartServiceSource, /CART_PHARMACY_LIMIT_ERROR_CODE/);

assert.match(
  backendErrorMiddlewareSource,
  /error\.code\s*\?\s*\{\s*code:\s*error\.code\s*\}/
);

assert.match(
  clientCartLimitSource,
  /backendCode\s*===\s*CART_PHARMACY_LIMIT_ERROR_CODE/
);
assert.doesNotMatch(clientCartLimitSource, /payload\s+as|message\.includes/);

assert.doesNotMatch(
  productCategoriesSource,
  /formatProductCategoryLabel|getProductCategoryOptions|new\s+Set|localeCompare/,
  'Product category config must not expose formatter aliases or process runtime product data'
);

assert.match(categoryOptionsHelperSource, /locale\s*=\s*'en-GB'/);
assert.match(categoryOptionsHelperSource, /new\s+Set/);
assert.match(categoryOptionsHelperSource, /localeCompare/);

assert.match(clientCategoryConsumerSource, /getProductFilters/);
assert.match(clientCategoryConsumerSource, /PRODUCT_CATEGORY_LABELS/);
assert.doesNotMatch(clientCategoryConsumerSource, /PRODUCTS_LIMIT\s*=\s*150/);

assert.match(pharmacyCategoryConsumerSource, /createUniqueLabeledOptions/);
assert.match(pharmacyCategoryConsumerSource, /PRODUCT_CATEGORY_LABELS/);

assert.match(clientStatisticsSource, /export type ClientStatisticsCounts/);
assert.match(clientStatisticsSource, /CLIENT_STATISTICS_LABELS/);

for (const canonicalCopySource of [
  'DELIVERY_METHOD_LABELS',
  'PAYMENT_METHOD_LABELS',
]) {
  assert.match(
    orderCopyConsumersSource,
    new RegExp(canonicalCopySource),
    `${canonicalCopySource} is not consumed by order UI`
  );
}

console.log(
  'Config contract check passed (runtime values, category labels/adapters, status presentation, cart error code, app-local filters/statistics, canonical order copy, notes, and auth-hint ownership).'
);
