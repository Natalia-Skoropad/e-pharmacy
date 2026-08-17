import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readComponent(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('keeps the cart limit message single-action and fully described', async () => {
  const modal = await readComponent(
    './common/CartOrderLimitModal/CartOrderLimitModal.tsx'
  );

  assert.equal((modal.match(/<Button\b/g) ?? []).length, 1);
  assert.match(modal, /describedBy=\{descriptionId\}/);
  assert.match(modal, /initialFocusRef=\{dismissButtonRef\}/);
  assert.doesNotMatch(modal, /ConfirmationModal|cancelLabel|onCancel/);
});

//===================================================================

test('closes the mobile overlay in state at desktop breakpoint', async () => {
  const [header, mobileCss] = await Promise.all([
    readComponent('./layout/Header/Header.tsx'),
    readComponent('./layout/MobileOffcanvas/MobileOffcanvas.module.css'),
  ]);

  assert.match(header, /matchMedia\('\(min-width: 1440px\)'\)/);
  assert.match(header, /subscribeToDesktopBreakpoint/);
  assert.match(header, /setIsMobileMenuOpen\(false\)/);

  assert.doesNotMatch(
    mobileCss,
    /@media[^{}]*min-width:\s*1440px[\s\S]*?\.backdrop[\s\S]*?display:\s*none/
  );
});

//===================================================================

test('keeps public feature actions as real links and exposes the scroll-to-top control', async () => {
  const [features, shell] = await Promise.all([
    readComponent('./home/HomeFeatureCards/HomeFeatureCards.tsx'),
    readComponent('./layout/AppShell/AppShell.tsx'),
  ]);

  assert.match(features, /<LinkButton/);
  assert.match(features, /href=\{feature\.href\}/);
  assert.doesNotMatch(features, /router\.push|useClientAuthCapabilities/);
  assert.match(shell, /<ScrollToTopButton \/>/);
  assert.match(shell, /id="main-content"/);
});

//===================================================================

test('does not publish placeholder social links or developer diagnostics', async () => {
  const sources = await Promise.all([
    readFile(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    readComponent('./layout/Footer/Footer.tsx'),
    readComponent('./common/ReviewsSection/ReviewsSection.tsx'),
    readComponent('./home/config/content.ts'),
    readComponent('./info/config/personal-data-notice.ts'),
    readComponent('./info/config/user-agreement.ts'),

    readComponent(
      './product-catalog/ProductCatalogPageContent/ProductCatalogPageContent.tsx'
    ),

    readComponent(
      './pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
    ),
  ]);

  const combined = sources.join('\n');

  assert.doesNotMatch(
    combined,
    /facebook\.com\/|instagram\.com\/|youtube\.com\//
  );

  assert.doesNotMatch(combined, /backend API|API is running|localhost/i);
  assert.doesNotMatch(combined, /\border requests?\b/i);
});

//===================================================================

test('keeps CartPageContent outside its own feature barrel cycle', async () => {
  const [pageContent, cartBarrel] = await Promise.all([
    readComponent('./cart/CartPageContent/CartPageContent.tsx'),
    readComponent('./cart/index.ts'),
  ]);

  assert.doesNotMatch(pageContent, /from ['"]@\/components\/cart['"]/);

  assert.match(cartBarrel, /from ['"]\.\/CartPageContent\/CartPageContent['"]/);
});

//===================================================================

test('keeps the restored home advantages and client review sections', async () => {
  const [homePage, homeContent, reviews] = await Promise.all([
    readFile(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    readComponent('./home/config/content.ts'),
    readComponent('./home/HomeReviewsSection/HomeReviewsSection.tsx'),
  ]);

  assert.match(homePage, /HOME_STATS\.map/);
  assert.match(homePage, /<HomeReviewsSection \/>/);
  assert.match(homeContent, /icon: Pill/);
  assert.match(homeContent, /icon: Building2/);
  assert.match(homeContent, /icon: Clock3/);
  assert.match(reviews, /aria-live="polite"/);
  assert.match(reviews, /Show previous review/);
  assert.match(reviews, /Show next review/);
  assert.equal((homeContent.match(/id: '[^']+-review'/g) ?? []).length, 7);
});

//===================================================================

test('keeps information navigation in the mobile drawer and hides draft copy', async () => {
  const [mobileMenu, infoPage] = await Promise.all([
    readComponent('./layout/MobileOffcanvas/MobileOffcanvas.tsx'),
    readComponent('./info/InfoPage/InfoPage.tsx'),
  ]);

  assert.match(mobileMenu, /MOBILE_MAIN_NAV_ITEMS/);
  assert.match(mobileMenu, />Main menu</);
  assert.match(mobileMenu, /INFO_SIDE_MENU_ITEMS/);
  assert.match(mobileMenu, /aria-label="Information pages"/);
  assert.doesNotMatch(mobileMenu, /isInformationPage/);

  assert.doesNotMatch(
    infoPage,
    /Draft document: formal approval is not recorded/
  );

  assert.doesNotMatch(infoPage, /Version \{metadata\.version\}/);
  assert.match(infoPage, /Updated\{' '\}/);
});

//===================================================================

test('uses the branded status layout for pharmacy application configuration errors', async () => {
  const configurationState = await readFile(
    new URL('../routes/PharmacyAppConfigurationState.tsx', import.meta.url),
    'utf8'
  );

  assert.match(configurationState, /variant="brand"/);
  assert.match(configurationState, /image=\{STATUS_PAGE_IMAGE\}/);
  assert.match(configurationState, /\/images\/status\/status-pills\.png/);
  assert.doesNotMatch(configurationState, /description=\{message\}/);
  assert.match(configurationState, /cannot be opened right now/);
});
