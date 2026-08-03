import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const read = (path) => readFile(resolve(ROOT, path), 'utf8');
const violations = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) violations.push(message);
};

const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) violations.push(message);
};

const requiredProductParts = [
  'ProductDetailsHero.tsx',
  'ProductDetailsTabs.tsx',
  'ProductOffersPanel.tsx',
  'ProductOffersToolbar.tsx',
  'ProductOfferList.tsx',
  'ProductOfferCard.tsx',
  'ProductCharacteristicsPanel.tsx',
  'ProductOrderInformationPanel.tsx',
  'ProductReviewsPanel.tsx',
  'useProductOffersView.ts',
  'useProductOfferCart.ts',
];

const requiredPharmacyParts = [
  'PharmacyDetailsHero.tsx',
  'PharmacyDetailsTabs.tsx',
  'PharmacyContactPanel.tsx',
  'PharmacyBankDetailsPanel.tsx',
  'PharmacyAboutPanel.tsx',
  'PharmacyReviewsPanel.tsx',
  'usePharmacyBankDetails.ts',
];

for (const file of requiredProductParts) {
  try {
    await access(
      resolve(
        ROOT,
        'apps/client/src/components/product-catalog/ProductDetailsPageContent',
        file
      )
    );
  } catch {
    violations.push(`Product Details split is missing ${file}.`);
  }
}

for (const file of requiredPharmacyParts) {
  try {
    await access(
      resolve(
        ROOT,
        'apps/client/src/components/pharmacies/PharmacyDetailsPageContent',
        file
      )
    );
  } catch {
    violations.push(`Pharmacy Details split is missing ${file}.`);
  }
}

const [
  productPage,
  productHero,
  offersPanel,
  offerList,
  offerCard,
  characteristics,
  pharmacyPage,
  pharmacyHero,
  bankHook,
  bankState,
  bankPanel,
  contactPanel,
  aboutPanel,
  productServer,
  pharmacyServer,
  parser,
] = await Promise.all([
  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOffersPanel.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOfferList.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOfferCard.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductCharacteristicsPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/usePharmacyBankDetails.ts'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/pharmacy-bank-details-state.ts'
  ),
  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyContactPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/server/ProductDetailPage.tsx'
  ),

  read('apps/client/src/components/pharmacies/server/PharmacyDetailPage.tsx'),
  read('packages/api-client/src/response/shared-dto-parsers.ts'),
]);

for (const [label, source, budget] of [
  ['ProductDetailsPageContent', productPage, 220],
  ['PharmacyDetailsPageContent', pharmacyPage, 220],
]) {
  const lines = source.split(/\r?\n/).length;
  if (lines > budget)
    violations.push(`${label} exceeds ${budget} lines (${lines}).`);

  forbidPattern(
    source,
    /catch\(\(\) => undefined\)|catch\(\(\) => null\)/,
    `${label} must not silently swallow errors.`
  );
}

forbidPattern(
  productPage,
  /getProductDetails|loadCart|setTimeout/,
  'Product Details must not refetch the full entity, own cart bootstrap, or fake async load-more.'
);

requirePattern(
  productHero,
  /<h1[^>]*>\{product\.name\}<\/h1>/,
  'Product Details must expose the visible product name as H1.'
);

requirePattern(
  offerList,
  /key=\{offer\.id\}/,
  'Product offer list must use offer.id.'
);

forbidPattern(
  offersPanel,
  /setTimeout|isOffersLoadingMore/,
  'Product offer slicing must remain synchronous.'
);

requirePattern(
  offerCard,
  /CART_ITEM_TTL_DAYS/,
  'Product offer card must use the canonical cart TTL.'
);

requirePattern(
  offerCard,
  /href=\{phoneHref\}/,
  'Product offer phone must use a validated tel link.'
);

requirePattern(
  offerCard,
  /Quantity for \$\{productName\} from \$\{offer\.pharmacyName\}/,
  'Product quantity label must identify its pharmacy offer.'
);

requirePattern(
  characteristics,
  /Detailed description is not available yet/,
  'Product description fallback must remain factual.'
);

forbidPattern(
  characteristics,
  /effective|treatment|matches your needs|compare pharmacy prices/i,
  'Product fallback must not fabricate medical or marketing claims.'
);

requirePattern(
  pharmacyHero,
  /<h1[^>]*>\{pharmacy\.name\}<\/h1>/,
  'Pharmacy Details must expose the visible pharmacy name as H1.'
);

forbidPattern(
  pharmacyHero,
  /pharmacy pharmacy/i,
  'Pharmacy Details must not duplicate the word pharmacy.'
);

for (const status of ['idle', 'loading', 'success', 'empty', 'error']) {
  requirePattern(
    bankState,
    new RegExp(`status: '${status}'`),
    `Bank-details state is missing ${status}.`
  );
}

requirePattern(
  bankHook,
  /AbortController/,
  'Bank-details request must be abortable.'
);

requirePattern(
  bankHook,
  /retry:/,
  'Bank-details controller must expose Retry.'
);

forbidPattern(
  bankHook,
  /queueMicrotask/,
  'Bank-details lifecycle must not use queueMicrotask workarounds.'
);

requirePattern(
  bankPanel,
  /state\.data\.receiptEmail/,
  'Receipt email must come from bank details.'
);

requirePattern(
  bankPanel,
  />\s*Retry\s*</,
  'Bank-details error state must render Retry.'
);
requirePattern(
  contactPanel,
  /mailto:\$\{pharmacy\.email\}/,
  'Contact email must use mailto semantics.'
);

requirePattern(
  contactPanel,
  /Copy pharmacy email/,
  'Contact email copy action must be explicit.'
);

requirePattern(
  aboutPanel,
  /has not added a public description yet/,
  'Pharmacy description fallback must remain factual.'
);

forbidPattern(
  aboutPanel,
  /\*\*|mini quest|white coat|active E-PHARMACY partner/i,
  'Pharmacy About must not contain ad hoc Markdown or fabricated claims.'
);

for (const [label, source] of [
  ['ProductDetailPage', productServer],
  ['PharmacyDetailPage', pharmacyServer],
]) {
  requirePattern(
    source,
    /reviewsData\?\.items \?\? \[\]/,
    `${label} must pass readonly review items directly.`
  );

  forbidPattern(
    source,
    /reviews=\{\[\.\.\./,
    `${label} must not create mutable review copies.`
  );
}

for (const invariant of [
  /availableQuantity > totalQuantity/,
  /reservedQuantity > totalQuantity/,
  /record\.inStock !== expectedInStock/,
]) {
  requirePattern(parser, invariant, `Offer parser is missing ${invariant}.`);
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  'Client detail component check passed (splits, SSR ownership, offers, cart, bank details, content, reviews and runtime invariants).'
);
