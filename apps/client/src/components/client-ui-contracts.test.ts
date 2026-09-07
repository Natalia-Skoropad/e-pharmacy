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

test('keeps public feature actions as real links and the shared shell free of transient skip controls', async () => {
  const [features, shell] = await Promise.all([
    readComponent('./home/HomeFeatureCards/HomeFeatureCards.tsx'),
    readComponent('./layout/AppShell/AppShell.tsx'),
  ]);

  assert.match(features, /<LinkButton/);
  assert.match(features, /href=\{feature\.href\}/);
  assert.doesNotMatch(features, /router\.push|useClientAuthCapabilities/);
  assert.match(shell, /<Header \/>/);
  assert.match(shell, /<ScrollToTopButton \/>/);

  assert.match(
    shell,
    /<div className=\{css\.content\} id="main-content">\s*\{children\}\s*<\/div>/
  );

  assert.doesNotMatch(shell, /Skip to main content|href="#main-content"/);
});

//===================================================================

test('freezes the client reference shell and server-rendered home baseline', async () => {
  const [rootLayout, homePage, loadingPage, pageLoader, pageLoaderStyles] =
    await Promise.all([
      readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/loading.tsx', import.meta.url), 'utf8'),

      readFile(
        new URL(
          '../../../../packages/ui/src/status-pages/PageLoader/PageLoader.tsx',
          import.meta.url
        ),
        'utf8'
      ),

      readFile(
        new URL(
          '../../../../packages/ui/src/status-pages/PageLoader/PageLoader.module.css',
          import.meta.url
        ),
        'utf8'
      ),
    ]);

  assert.doesNotMatch(rootLayout, /^['\"]use client['\"];?/m);

  assert.match(
    rootLayout,
    /<ClientProviders>[\s\S]*?<AppShell>\{children\}<\/AppShell>[\s\S]*?<\/ClientProviders>/
  );

  assert.doesNotMatch(homePage, /^['\"]use client['\"];?/m);
  assert.doesNotMatch(homePage, /cookies\(|headers\(|@\/lib\/api\/browser/);

  assert.match(
    homePage,
    /<Image[\s\S]*?src="\/images\/home\/three-pills\.png"[\s\S]*?alt=""[\s\S]*?width=\{749\}[\s\S]*?height=\{508\}[\s\S]*?priority[\s\S]*?fetchPriority="high"[\s\S]*?sizes=/
  );

  assert.match(
    homePage,
    /getPharmacies\([\s\S]*?page:\s*1,[\s\S]*?perPage:\s*HOME_PREVIEW_LIMIT,[\s\S]*?sort:\s*'rating-desc'[\s\S]*?PUBLIC_COMMERCE_CACHE_OPTIONS/
  );

  assert.match(
    homePage,
    /getProducts\([\s\S]*?page:\s*1,[\s\S]*?perPage:\s*HOME_PREVIEW_LIMIT,[\s\S]*?sort:\s*'rating-desc'[\s\S]*?PUBLIC_COMMERCE_CACHE_OPTIONS/
  );

  assert.equal((homePage.match(/<Suspense\b/g) ?? []).length, 2);
  assert.match(homePage, /CatalogCardSkeleton/);
  assert.match(homePage, /count=\{HOME_PREVIEW_LIMIT\}/);

  assert.match(
    homePage,
    /<Suspense fallback=\{<FeaturedSectionFallback label="pharmacies" \/>\}>[\s\S]*?<FeaturedPharmaciesSection \/>[\s\S]*?<\/Suspense>/
  );

  assert.match(
    homePage,
    /<Suspense fallback=\{<FeaturedSectionFallback label="products" \/>\}>[\s\S]*?<FeaturedProductsSection \/>[\s\S]*?<\/Suspense>/
  );

  assert.match(loadingPage, /return <PageLoader \/>/);
  assert.match(pageLoader, /role="status"/);
  assert.match(pageLoader, /label = 'Loading page'/);
  assert.match(pageLoader, /aria-label=\{label\}/);
  assert.match(pageLoaderStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageLoaderStyles, /animation:\s*none/);
});

//===================================================================

test('catalog routes use six-card skeleton loading states with reduced-motion support', async () => {
  const [
    skeleton,
    skeletonStyles,
    catalogLoading,
    productLoading,
    pharmacyLoading,
  ] = await Promise.all([
    readComponent('./catalog/CatalogCardSkeleton/CatalogCardSkeleton.tsx'),

    readComponent(
      './catalog/CatalogCardSkeleton/CatalogCardSkeleton.module.css'
    ),

    readComponent('./catalog/CatalogPageLoading/CatalogPageLoading.tsx'),

    readFile(
      new URL(
        '../app/(public)/(products)/product-catalog/loading.tsx',
        import.meta.url
      ),
      'utf8'
    ),

    readFile(
      new URL(
        '../app/(public)/(pharmacies)/pharmacies/loading.tsx',
        import.meta.url
      ),
      'utf8'
    ),
  ]);

  assert.match(skeleton, /count = 6/);
  assert.match(skeleton, /role="status"/);
  assert.match(skeletonStyles, /aspect-ratio:\s*16 \/ 10/);
  assert.match(skeletonStyles, /min-height:\s*210px/);
  assert.match(skeletonStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(catalogLoading, /<CatalogCardSkeleton count=\{6\}/);
  assert.match(productLoading, /label="Loading products"/);
  assert.match(pharmacyLoading, /label="Loading pharmacies"/);
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

test('preserves all home blocks while keeping stats and customer reviews stable', async () => {
  const [homePage, homeStyles, homeContent, reviews, reviewStyles, recovery] =
    await Promise.all([
      readFile(new URL('../app/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/page.module.css', import.meta.url), 'utf8'),
      readComponent('./home/config/content.ts'),
      readComponent('./home/HomeReviewsSection/HomeReviewsSection.tsx'),
      readComponent('./home/HomeReviewsSection/HomeReviewsSection.module.css'),
      readComponent('./catalog/CatalogAutoRecovery/CatalogAutoRecovery.tsx'),
    ]);

  const orderedHomeMarkers = [
    'aria-labelledby="home-title"',
    'HOME_STATS.map',
    'aria-labelledby="pharmacies-title"',
    'aria-labelledby="steps-title"',
    'aria-labelledby="banner-title"',
    'aria-labelledby="benefits-title"',
    'aria-labelledby="products-title"',
    'aria-labelledby="features-title"',
    '<HomeReviewsSection />',
  ];

  let previousIndex = -1;

  for (const marker of orderedHomeMarkers) {
    const currentIndex = homePage.indexOf(marker);
    assert.ok(
      currentIndex > previousIndex,
      `Missing or reordered home block: ${marker}`
    );

    previousIndex = currentIndex;
  }

  assert.match(homeContent, /icon: Pill/);
  assert.match(homeContent, /icon: Building2/);
  assert.match(homeContent, /icon: Clock3/);
  assert.doesNotMatch(homeContent, /126\+|98\+|partner pharmacy stores/);

  assert.doesNotMatch(
    homeContent,
    /HOME_REVIEWS_PROVENANCE|provenance:\s*'demo'/
  );

  assert.doesNotMatch(
    [homeContent, reviews].join('\n'),
    /\b(?:sample|demo|examples?)\b/i
  );

  assert.match(reviews, /Customer reviews/);
  assert.match(reviews, /aria-live="polite"/);
  assert.match(reviews, /role="group"/);

  const reviewComments = [
    ...homeContent.matchAll(/comment:\s*\n?\s*'([^']+)'/g),
  ].map((match) => match[1] ?? '');

  assert.equal(reviewComments.length, 7);

  assert.equal(
    new Set(reviewComments.map((comment) => comment.length)).size,
    1
  );

  assert.match(reviewStyles, /\.dot\s*\{[\s\S]*?width:\s*36px;/);
  assert.match(reviewStyles, /\.dot::before\s*\{[\s\S]*?width:\s*8px;/);

  assert.match(
    reviewStyles,
    /\.dot\[aria-current='true'\]::before\s*\{[\s\S]*?width:\s*28px;/
  );

  for (const legacySelector of [
    '.pharmacyCard',
    '.featureCard',
    '.rating',
    '.status',
    '.pharmacyLink',
    '.sectionError',
  ]) {
    assert.equal(
      homeStyles.includes(legacySelector),
      false,
      `Legacy homepage selector should be removed: ${legacySelector}`
    );
  }

  assert.doesNotMatch(
    [homePage, homeContent, reviews].join('\n'),
    /AggregateRating|schema\.org\/Review/
  );

  assert.match(recovery, /useRouter\(\)/);
  assert.match(recovery, /router\.refresh\(\)/);
  assert.match(recovery, /This section is temporarily unavailable/);
  assert.match(recovery, /<CatalogCardSkeleton/);
  assert.match(recovery, /count=\{6\}/);
  assert.doesNotMatch(recovery, /useEffect|location\.reload|setTimeout/);

  assert.match(
    homePage,
    /FeaturedPharmaciesSection[\s\S]*?<CatalogAutoRecovery label="pharmacies" compact \/>/
  );

  assert.match(
    homePage,
    /FeaturedProductsSection[\s\S]*?<CatalogAutoRecovery label="products" compact \/>/
  );
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

test('app-level client status boundaries opt into one main landmark', async () => {
  const [errorPage, notFoundPage] = await Promise.all([
    readFile(new URL('../app/error.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/not-found.tsx', import.meta.url), 'utf8'),
  ]);

  for (const source of [errorPage, notFoundPage]) {
    assert.match(source, /variant="brand"/);
    assert.match(source, /landmark="main"/);
    assert.match(source, /image=\{STATUS_PAGE_IMAGE\}/);
  }
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
