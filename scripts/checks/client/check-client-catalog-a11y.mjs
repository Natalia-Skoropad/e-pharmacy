import { readFile } from 'node:fs/promises';
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

const [
  semantics,
  productCard,
  pharmacyCard,
  grid,
  filtersShell,
  productHero,
  pharmacyHero,
  offerCard,
  contactPanel,
  bankPanel,
  tabs,
  productDetails,
  pharmacyDetails,
] = await Promise.all([
  read(
    'apps/client/src/components/catalog/CatalogEntityCard/CatalogCardSemantics.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductCard/ProductCard.tsx'
  ),

  read('apps/client/src/components/pharmacies/PharmacyCard/PharmacyCard.tsx'),
  read('apps/client/src/components/catalog/CatalogGrid/CatalogGrid.tsx'),

  read(
    'apps/client/src/components/catalog/CatalogFiltersShell/CatalogFiltersShell.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOfferCard.tsx'
  ),
  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyContactPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
  ),

  read('packages/ui/src/navigation/Tabs/Tabs.tsx'),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  ),
]);

requirePattern(
  semantics,
  /useId\(\)/,
  'Catalog cards need instance-scoped IDs.'
);

requirePattern(
  semantics,
  /level === 3 \? 'h3' : 'h2'/,
  'Catalog card headings must support H2 and H3 contexts.'
);

requirePattern(
  productCard,
  /headingLevel\s*=\s*2/,
  'ProductCard must default to an H2 catalog heading.'
);

requirePattern(
  pharmacyCard,
  /headingLevel\s*=\s*2/,
  'PharmacyCard must default to an H2 catalog heading.'
);

requirePattern(
  grid,
  /<ul[^>]*aria-label=\{ariaLabel\}/,
  'CatalogGrid must expose list semantics and an accessible name.'
);

requirePattern(grid, /<li/, 'CatalogGrid items must use list-item semantics.');

requirePattern(
  filtersShell,
  /<section[\s\S]*aria-labelledby=\{headingId\}/,
  'Catalog filters require a named region.'
);

requirePattern(
  filtersShell,
  /aria-busy=\{isPending \|\| undefined\}/,
  'Catalog filters require pending semantics.'
);

requirePattern(
  filtersShell,
  /role="status"/,
  'Catalog filters require an update status.'
);

requirePattern(
  productHero,
  /<h1[^>]*>\{product\.name\}<\/h1>/,
  'Product details need a visible product-name H1.'
);

requirePattern(
  pharmacyHero,
  /<h1[^>]*>\{pharmacy\.name\}<\/h1>/,
  'Pharmacy details need a visible pharmacy-name H1.'
);

requirePattern(
  offerCard,
  /href=\{phoneHref\}/,
  'Valid offer phones must be tel links.'
);

requirePattern(
  offerCard,
  /Quantity for \$\{productName\} from \$\{offer\.pharmacyName\}/,
  'Offer quantity controls need contextual labels.'
);

requirePattern(
  offerCard,
  /Favorite pharmacy/,
  'Favorite-pharmacy status must be present in visible offer content.'
);

requirePattern(
  contactPanel,
  /mailto:\$\{pharmacy\.email\}/,
  'Public pharmacy email must be a mailto link.'
);

requirePattern(
  contactPanel,
  /Copy pharmacy email/,
  'Copy-email action needs an explicit accessible label.'
);

requirePattern(
  bankPanel,
  />\s*Retry\s*</,
  'Bank-details error state needs a Retry action.'
);

requirePattern(
  tabs,
  /aria-controls=\{getTabPanelId/,
  'Tabs need aria-controls.'
);

requirePattern(tabs, /role="tabpanel"/, 'Tabs need a tabpanel primitive.');

requirePattern(
  tabs,
  /aria-labelledby=\{getTabId/,
  'Tabpanels need aria-labelledby.'
);

forbidPattern(
  productDetails,
  /aria-live="polite"/,
  'Product detail panels must not be broad live regions.'
);

forbidPattern(
  pharmacyDetails.replace(
    /<p className="visually-hidden" role="status" aria-live="polite">[\s\S]*?<\/p>/,
    ''
  ),
  /aria-live="polite"/,
  'Pharmacy detail panels must not be broad live regions.'
);

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  'Client catalog accessibility check passed (cards, lists, filters, details, offers, email actions and tabs).'
);
