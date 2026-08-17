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
  appShell,
  cartModal,
  reviewComposer,
  reviewRating,
  favorite,
  stock,
  details,
  header,
  mobile,
  footer,
  infoPage,
  catalogCard,
  catalogCardSemantics,
  catalogGrid,
  productDetails,
  productHero,
  productOfferCard,
  pharmacyDetails,
  pharmacyHero,
  pharmacyContact,
  pharmacyBankDetails,
  tabs,
] = await Promise.all([
  read('apps/client/src/components/layout/AppShell/AppShell.tsx'),

  read(
    'apps/client/src/components/common/CartOrderLimitModal/CartOrderLimitModal.tsx'
  ),

  read('apps/client/src/components/common/ReviewsSection/ReviewComposer.tsx'),

  read(
    'apps/client/src/components/common/ReviewsSection/ReviewRatingInput.tsx'
  ),

  read(
    'apps/client/src/components/common/FavoriteToggleButton/FavoriteToggleButton.tsx'
  ),

  read(
    'apps/client/src/components/common/StockAvailability/StockAvailability.tsx'
  ),

  read('apps/client/src/components/common/DetailsUnavailablePage.tsx'),
  read('apps/client/src/components/layout/Header/Header.tsx'),
  read('apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.tsx'),
  read('apps/client/src/components/layout/Footer/Footer.tsx'),
  read('apps/client/src/components/info/InfoPage/InfoPage.tsx'),

  read(
    'apps/client/src/components/catalog/CatalogEntityCard/CatalogEntityCard.tsx'
  ),

  read(
    'apps/client/src/components/catalog/CatalogEntityCard/CatalogCardSemantics.tsx'
  ),

  read('apps/client/src/components/catalog/CatalogGrid/CatalogGrid.tsx'),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOfferCard.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsHero.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyContactPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
  ),

  read('packages/ui/src/navigation/Tabs/Tabs.tsx'),
]);

//===================================================================

requirePattern(
  appShell,
  /<ScrollToTopButton \/>/,
  'AppShell: scroll-to-top control is missing.'
);

requirePattern(
  appShell,
  /id="main-content"/,
  'AppShell: stable main-content target is missing.'
);

requirePattern(
  cartModal,
  /describedBy=\{descriptionId\}/,
  'CartOrderLimitModal: aria-describedby contract is missing.'
);

requirePattern(
  cartModal,
  /initialFocusRef=\{dismissButtonRef\}/,
  'CartOrderLimitModal: dismiss action must receive initial focus.'
);

if ((cartModal.match(/<Button\b/g) ?? []).length !== 1)
  violations.push(
    'CartOrderLimitModal: exactly one primary dismiss action is required.'
  );

requirePattern(
  reviewComposer,
  /<ReviewRatingInput/,
  'ReviewComposer: accessible rating input composition is missing.'
);

requirePattern(
  reviewRating,
  /role="radiogroup"/,
  'ReviewRatingInput: rating radiogroup is missing.'
);

requirePattern(
  reviewRating,
  /type="radio"/,
  'ReviewRatingInput: rating options must be radios.'
);

requirePattern(
  reviewRating,
  /aria-invalid=/,
  'ReviewRatingInput: rating invalid state is missing.'
);

requirePattern(
  reviewRating,
  /aria-describedby=/,
  'ReviewRatingInput: rating error description is missing.'
);

requirePattern(
  favorite,
  /aria-busy=\{pending \|\| undefined\}/,
  'FavoriteToggleButton: pending state must be announced.'
);

requirePattern(
  favorite,
  /interactionLockRef/,
  'FavoriteToggleButton: rapid-click lock is missing.'
);

requirePattern(
  stock,
  /Availability is not confirmed\./,
  'StockAvailability: unknown wording is missing.'
);

forbidPattern(
  stock,
  /Math\.max\(0/,
  'StockAvailability: malformed values must not be normalized to zero.'
);

requirePattern(
  details,
  /<main>/,
  'DetailsUnavailablePage: main landmark is missing.'
);

requirePattern(
  details,
  /router\.refresh\(\)/,
  'DetailsUnavailablePage: retry must use router.refresh().'
);

forbidPattern(
  details,
  /window\.location\.reload/,
  'DetailsUnavailablePage: full page reload is forbidden.'
);

requirePattern(
  header,
  /Checking your session/,
  'Header: session loading status is missing.'
);

requirePattern(
  header,
  /formatCountLabel/,
  'Header: canonical count label formatter is missing.'
);

requirePattern(
  mobile,
  /onClick=\{onClose\}/,
  'MobileOffcanvas: navigation actions must close the menu directly.'
);

forbidPattern(
  footer,
  /target="_blank"/,
  'Footer: unverified external links must not be rendered.'
);

requirePattern(
  infoPage,
  /dateTime=\{metadata\.updatedAt\.iso\}/,
  'InfoPage: machine-readable revision date is missing.'
);

requirePattern(
  catalogCardSemantics,
  /useId\(\)/,
  'CatalogEntityCard: each card instance must use a unique DOM ID.'
);

requirePattern(
  catalogCard,
  /headingLevel\?: CatalogCardHeadingLevel/,
  'CatalogEntityCard: contextual heading-level contract is missing.'
);

requirePattern(
  catalogGrid,
  /<ul[^>]*aria-label=/,
  'CatalogGrid: catalog collections must use list semantics.'
);

requirePattern(
  catalogGrid,
  /<li className=/,
  'CatalogGrid: catalog items must use list-item semantics.'
);

requirePattern(
  productHero,
  /<h1 className=\{css\.title\}>\{product\.name\}<\/h1>/,
  'ProductDetails: visible product-name H1 is missing.'
);

requirePattern(
  productOfferCard,
  /href=\{phoneHref\}/,
  'ProductOfferCard: valid pharmacy phones must use tel links.'
);

requirePattern(
  productOfferCard,
  /Quantity for \$\{productName\} from \$\{offer\.pharmacyName\}/,
  'ProductOfferCard: quantity controls need offer-specific labels.'
);

requirePattern(
  pharmacyHero,
  /<h1 className=\{css\.title\}>\{pharmacy\.name\}<\/h1>/,
  'PharmacyDetails: visible pharmacy-name H1 is missing.'
);

requirePattern(
  pharmacyContact,
  /mailto:\$\{pharmacy\.email\}/,
  'PharmacyContactPanel: contact email must be a mailto link.'
);

requirePattern(
  pharmacyBankDetails,
  />\s*Retry\s*</,
  'PharmacyBankDetailsPanel: retry action is missing.'
);

forbidPattern(
  `${productDetails}
${pharmacyDetails}`,
  /aria-live="polite"[^>]*className=\{css\.tabSection\}/,
  'Details pages: tab panels must not be broad live regions.'
);

requirePattern(
  tabs,
  /aria-controls=\{getTabPanelId/,
  'Tabs: aria-controls relationship is missing.'
);

requirePattern(
  tabs,
  /role="tabpanel"/,
  'Tabs: shared tabpanel primitive is missing.'
);

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Client component accessibility contract check passed.');
