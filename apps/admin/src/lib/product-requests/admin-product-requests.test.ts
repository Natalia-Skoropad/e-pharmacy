import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  normalizeProductRequestStatisticsResponse,
  normalizeProductRequestsResponse,
} from './admin-product-requests';

import {
  buildProductRequestsPath,
  isProductRequestsFilterRoute,
  parseProductRequestsPaginationSegments,
  parseProductRequestsSegments,
} from './admin-product-request-paths';

import { getProductRequestImageSrc } from './product-request-images';

//===============================================================

const ROOT = '/admin/product-requests';
const OWNER = '6aac129a64c36860fb1e4e0f';
const REQUEST = '6b05d934645d3aea16f66cd4';

//===============================================================

const segments = (path: string) => ({
  filters: path.slice(ROOT.length).split('/').filter(Boolean),
});

//===============================================================

for (const [suffix, filters, pagination] of [
  ['status-new', { status: 'new' }, {}],
  ['status-on-moderation', { status: 'on_moderation' }, {}],
  [`owner-id-${OWNER}`, { ownerId: OWNER }, {}],
  [`request-id-${REQUEST}`, { requestId: REQUEST }, {}],

  [
    'date-from-2026-11-01/date-to-2026-11-25',
    { date: { from: '2026-11-01', to: '2026-11-25' } },
    {},
  ],

  ['category-medicine', { category: 'medicine' }, {}],

  [
    'category-mode-custom',
    { category: CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER },
    {},
  ],

  ['page-2', {}, { page: 2 }],
  ['per-page-50', {}, { perPage: 50 }],
] as const) {
  test(`canonical URL: ${suffix}`, () => {
    const path = `${ROOT}/${suffix}`;
    const parsed = parseProductRequestsSegments(segments(path));
    const pages = parseProductRequestsPaginationSegments(segments(path));

    assert.deepEqual(parsed, {
      ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
      ...filters,
    });

    assert.deepEqual(pages, { page: 1, perPage: 20, ...pagination });
    assert.equal(buildProductRequestsPath(parsed, pages), path);
  });
}

//===============================================================

test('owner and request filters round trip with date, status, category and pagination', () => {
  const state = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    ownerId: OWNER,
    requestId: REQUEST,
    category: 'medical_devices',
    status: 'on_moderation' as const,
    date: { from: '2026-11-01', to: '2026-11-25' },
  };

  const url = buildProductRequestsPath(state, { page: 2, perPage: 50 });

  assert.equal(
    url,
    `${ROOT}/request-id-${REQUEST}/owner-id-${OWNER}/category-medical_devices/status-on-moderation/date-from-2026-11-01/date-to-2026-11-25/page-2/per-page-50`
  );

  assert.deepEqual(parseProductRequestsSegments(segments(url)), state);

  assert.deepEqual(parseProductRequestsPaginationSegments(segments(url)), {
    page: 2,
    perPage: 50,
  });
});

//===============================================================

test('invalid ids, dates and pagination normalize without confusing details with list filters', () => {
  assert.equal(isProductRequestsFilterRoute([REQUEST]), false);

  assert.equal(
    isProductRequestsFilterRoute(['owner-id-' + OWNER, 'page-2']),
    true
  );

  assert.deepEqual(
    parseProductRequestsSegments({
      filters: [
        'owner-id-bad',
        'request-id-bad',
        'date-from-2026-11-25',
        'date-to-2026-11-01',
        'status-unknown',
      ],
    }),
    DEFAULT_PRODUCT_REQUESTS_FILTERS
  );

  assert.deepEqual(
    parseProductRequestsPaginationSegments({
      filters: ['page-0', 'per-page-999'],
    }),
    { page: 1, perPage: 20 }
  );
});

//===============================================================

test('four global statistics validate independently of the list', () => {
  assert.deepEqual(
    normalizeProductRequestStatisticsResponse({
      new: 1,
      on_moderation: 2,
      approved: 3,
      rejected: 4,
    }),
    { new: 1, on_moderation: 2, approved: 3, rejected: 4 }
  );

  assert.throws(() =>
    normalizeProductRequestStatisticsResponse({
      new: 1,
      on_moderation: 2,
      approved: -1,
      rejected: 4,
    })
  );
});

//===============================================================

test('rows preserve owner, long names, empty category, and review/cancellation status', () => {
  const name = 'A'.repeat(200);

  const row = {
    id: REQUEST,
    owner: { id: OWNER, name },
    requestNumber: REQUEST,
    createdAt: '2026-11-25T08:00:00.000Z',
    productName: name,
    productArticle: '',
    categoryMode: 'catalog',
    status: 'new',
  };

  const payload = {
    items: [row],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-11-25',
  };

  const result = normalizeProductRequestsResponse(payload);

  assert.equal(result.items[0]?.productName, name);
  assert.equal(result.items[0]?.owner?.name, name);
  assert.equal(result.items[0]?.category, undefined);
  assert.equal(result.items[0]?.productArticle, '');

  assert.equal(
    normalizeProductRequestsResponse({
      ...payload,
      items: [
        { ...row, status: 'on_moderation', reviewState: 'changes_requested' },
      ],
    }).items[0]?.reviewState,
    'changes_requested'
  );

  assert.equal(
    normalizeProductRequestsResponse({
      ...payload,
      items: [{ ...row, status: 'rejected', cancelledBy: 'owner' }],
    }).items[0]?.cancelledBy,
    'owner'
  );

  assert.deepEqual(
    normalizeProductRequestsResponse({
      ...payload,
      items: [],
      page: 1,
      total: 0,
      totalPages: 0,
    }).items,
    []
  );
});

//===============================================================

test('seed images use the existing same-origin Admin rewrite and media paths stay same-origin', () => {
  assert.equal(
    getProductRequestImageSrc('/images/seed/products/product-001.png'),
    '/images/seed/products/product-001.png'
  );

  assert.equal(
    getProductRequestImageSrc('images/seed/products/product-001.png'),
    '/images/seed/products/product-001.png'
  );

  assert.equal(
    getProductRequestImageSrc(
      'https://example.test/images/seed/products/product-001.png'
    ),
    '/images/seed/products/product-001.png'
  );

  assert.equal(
    getProductRequestImageSrc('/api/media/photo/thumbnail'),
    '/api/media/photo/thumbnail'
  );

  assert.equal(getProductRequestImageSrc(undefined), undefined);
});

//===============================================================

test('registry renders exactly two searches with distinct scope-key namespaces', async () => {
  const source = await readFile(
    new URL(
      '../../components/product-requests/AdminProductRequestsList.tsx',
      import.meta.url
    ),
    'utf8'
  );

  const grid = source
    .split('<div className={css.searchGrid}>')[1]
    ?.split('</section>')[0];

  assert.ok(grid);
  assert.equal([...grid.matchAll(/<PharmacyOwnerSearch\b/g)].length, 1);
  assert.equal([...grid.matchAll(/<ProductRequestSearch\b/g)].length, 1);
  assert.equal([...grid.matchAll(/<FiltersButton\b/g)].length, 1);

  // With both IDs empty, ownerScope and requestScope serialize identically.
  // A distinct namespace per sibling is required even when status/date/category change.
  assert.match(
    grid,
    /<PharmacyOwnerSearch key=\{`owner-search:\$\{JSON\.stringify\(ownerScope\)\}`\}/
  );

  assert.match(
    grid,
    /<ProductRequestSearch key=\{`request-search:\$\{JSON\.stringify\(requestScope\)\}`\}/
  );
});

//===============================================================

test('product request counters share one permission-gated provider across Admin menus', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [layout, provider, desktop, mobile, badges, details, css] =
    await Promise.all([
      read('../../app/admin/layout.tsx'),
      read('../../providers/AdminProductRequestNavigationBadgeProvider.tsx'),
      read('../../components/layout/AdminSidebar/AdminSidebar.tsx'),
      read('../../components/layout/AdminMobileMenu/AdminMobileMenu.tsx'),

      read(
        '../../components/layout/ProductRequestNavigationBadges/ProductRequestNavigationBadges.tsx'
      ),

      read('../../components/product-requests/AdminProductRequests.tsx'),

      read(
        '../../components/layout/PharmacyNavigationBadges/PharmacyNavigationBadges.module.css'
      ),
    ]);

  assert.match(
    layout,
    /<AdminProductRequestNavigationBadgeProvider>\s*<AdminShell>/
  );

  assert.match(provider, /ADMIN_PERMISSIONS\.productRequests\.view/);
  assert.match(provider, /if \(!canView \|\| !userId\) return/);

  assert.match(
    provider,
    /getAdminProductRequestStatistics\(\{ signal: controller\.signal \}\)/
  );

  assert.match(provider, /new: stats\.new, onModeration: stats\.on_moderation/);
  assert.match(provider, /snapshot\?\.userId === userId/);
  assert.match(provider, /counts: null/);

  assert.match(
    provider,
    /controller\.signal\.aborted \|\| currentVersion !== version/
  );

  assert.match(provider, /active\?\.abort\(\)/);
  assert.match(provider, /subscribeToProductRequestNavigationRefresh/);
  assert.match(provider, /window\.addEventListener\('focus', onFocus\)/);
  assert.match(desktop, /item\.href === ADMIN_ROUTES\.PRODUCT_REQUESTS/);
  assert.match(mobile, /item\.href === ADMIN_ROUTES\.PRODUCT_REQUESTS/);

  assert.match(
    desktop,
    /<ProductRequestNavigationBadges\s+counts=\{productRequestCounts\}\s+collapsed=\{isCollapsed\}/
  );

  assert.match(
    mobile,
    /<ProductRequestNavigationBadges counts=\{productRequestCounts\}/
  );

  assert.match(
    mobile,
    /if \(isOpen\) requestProductRequestNavigationRefresh\(\)/
  );

  assert.match(
    details,
    /await localApiRequest\(adminApiRoutes\.productRequests\.status\(requestId\), \{[\s\S]*?requestProductRequestNavigationRefresh\(\);/
  );

  assert.equal(
    [...badges.matchAll(/key: '(\w+)'/g)].map((match) => match[1]).join(','),
    'new,onModeration'
  );

  assert.match(badges, /counts\[key\] > 0/);
  assert.match(badges, /counts\[key\] > 99 \? '99\+'/);
  assert.match(badges, /css\.collapsedBadges/);
  assert.match(css, /\.new\s*\{\s*background-color: var\(--color-info\)/);

  assert.match(
    css,
    /\.moderation\s*\{\s*background-color: var\(--color-warning\)/
  );
});

//===============================================================

test('product request navigation refresh notifies mounted consumers and unsubscribes cleanly', async () => {
  const {
    requestProductRequestNavigationRefresh,
    subscribeToProductRequestNavigationRefresh,
  } = await import('./product-request-navigation-refresh');

  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: new EventTarget(),
  });

  try {
    let calls = 0;

    const unsubscribe = subscribeToProductRequestNavigationRefresh(() => {
      calls += 1;
    });

    requestProductRequestNavigationRefresh();
    requestProductRequestNavigationRefresh();
    assert.equal(calls, 2);
    unsubscribe();
    requestProductRequestNavigationRefresh();
    assert.equal(calls, 2);
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

//===============================================================

// Stage 14.18.264: detail routes, saved values, and separate Admin resources.
test('request detail tabs have stable canonical URLs and separate saved values', async () => {
  const {
    REQUEST_TABS,
    requestTabPath,
    isRequestTab,
    parseAdminRequestDetail,
  } = await import('./admin-product-request-detail');

  assert.equal(REQUEST_TABS.length, 8);
  assert.equal(requestTabPath(REQUEST, 'details'), `${ROOT}/${REQUEST}`);

  for (const tab of REQUEST_TABS.slice(1))
    assert.equal(requestTabPath(REQUEST, tab), `${ROOT}/${REQUEST}/${tab}`);

  assert.equal(isRequestTab('status-new'), false);

  const result = parseAdminRequestDetail({
    owner: { id: OWNER, name: 'Owner', status: 'active' },

    request: {
      id: REQUEST,
      name: 'Saved name',
      productName: 'Catalog name',
      article: 'REQ-001',
      productArticle: 'CAT-001',
      categoryMode: 'catalog',
      status: 'on_moderation',
      reviewState: 'changes_requested',
      createdAt: '2026-11-24T12:00:00.000Z',
      updatedAt: '2026-11-25T12:00:00.000Z',
      pharmacyComment: 'Note for Admin',

      additionalFiles: [
        {
          documentId: OWNER,
          name: 'info.pdf',
          type: 'application/pdf',
          size: 12,
        },
      ],

      history: [
        {
          id: 'history-1',
          status: 'on_moderation',
          title: 'Changes requested',
          description: 'Correct the data.',
          actorName: 'Reviewing Admin',
          createdAt: '2026-11-25T12:00:00.000Z',
          isInferred: false,
        },
      ],
    },
  });

  assert.equal(result.name, 'Saved name');
  assert.equal(result.values.article, 'REQ-001');
  assert.equal(result.values.pharmacyComment, 'Note for Admin');
  assert.equal(result.ownerDetail?.id, OWNER);
  assert.equal(result.files[0]?.documentId, OWNER);
  assert.equal(result.history[0]?.isInferred, false);
  assert.equal(result.history[0]?.actorName, 'Reviewing Admin');
  assert.equal(result.reviewState, 'changes_requested');

  assert.throws(() =>
    parseAdminRequestDetail({ request: { name: 'Invalid' } })
  );
});

//===============================================================

test('Admin detail exposes read-only panels and only the allowed moderation actions', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [detail, panels, routes] = await Promise.all([
    read('../../components/product-requests/AdminProductRequests.tsx'),
    read('../../components/product-requests/AdminProductRequestPanels.tsx'),
    read('../../app/admin/product-requests/[requestId]/[tab]/page.tsx'),
  ]);

  assert.match(
    detail,
    /canModerate && request\?\.status === 'on_moderation' && !request\.reviewState/
  );

  assert.match(detail, /disabled=\{!canDecide \|\| busy\}/);

  assert.match(
    detail,
    /canModerate && request\?\.status === 'on_moderation' \?/
  );

  assert.match(detail, /scopeRequestId=\{requestId\}/);
  assert.match(detail, /api=\{productRequestCommentsApi\}/);
  assert.doesNotMatch(detail + panels, /Save changes|Save draft|onSave=/);
  assert.match(panels, /readOnly/);
  assert.match(routes, /isProductRequestsFilterRoute\(\[requestId, tab\]\)/);
});

//===============================================================

test('private Admin comments and audit endpoints are scoped to a product request', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [routes, service, audit, ownerMutation] = await Promise.all([
    read('../../../../api/src/routes/admin/admin.routes.ts'),

    read(
      '../../../../api/src/services/admin/catalog/product-request-admin-comment.service.ts'
    ),

    read('../../../../api/src/services/admin/audit/admin-audit-filters.ts'),

    read(
      '../../../../api/src/services/catalog/product-request-management.service.ts'
    ),
  ]);

  assert.match(
    routes,
    /post\('\/product-requests\/:requestId\/comments', requireAdminPermission\(ADMIN_PERMISSIONS\.productRequests\.edit\)/
  );

  assert.match(
    routes,
    /get\('\/product-requests\/:requestId\/activity', requireAdminPermission\(ADMIN_PERMISSIONS\.productRequests\.view\)/
  );

  assert.match(
    service,
    /ProductRequestAdminComment\.find\(\{ productRequestId \}\)/
  );

  assert.match(service, /\{ _id: commentId, productRequestId \}/);
  assert.match(service, /scopeEntityId: productRequestId/);

  assert.match(
    audit,
    /entityType: ADMIN_AUDIT_ENTITY_TYPES\.PRODUCT_REQUEST, entityId: id/
  );

  assert.match(
    audit,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PRODUCT_REQUEST, scopeEntityId: id/
  );

  assert.equal(
    [...ownerMutation.matchAll(/await auditProductRequestMutation\(/g)].length,
    5
  );
});

//===============================================================

test('Admin product data contains the fill image and stacks both ingredient fields', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [panels, styles] = await Promise.all([
    read('../../components/product-requests/AdminProductRequestPanels.tsx'),

    read(
      '../../components/product-requests/AdminProductRequestPanels.module.css'
    ),
  ]);

  assert.match(styles, /\.imagePreview\s*\{[^}]*position:\s*relative;/);
  assert.match(styles, /\.imagePreview\s*\{[^}]*overflow:\s*hidden;/);
  assert.match(panels, /<ShimmerImage\s+key=\{image\}/);
  assert.match(panels, /labels=\{\{ dropzoneTitle: 'Product image' \}\}/);

  assert.match(
    panels,
    /className=\{css\.stackedFields\}>\s*\{input\('activeIngredients',[^\n]*\)\}\s*\{input\('activeIngredientCount',/
  );

  assert.match(
    styles,
    /\.stackedFields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/
  );
});

//===============================================================

test('request comments and audit show a zero count while loading, without a duplicate legacy history block', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [detail, comments, history] = await Promise.all([
    read('../../components/product-requests/AdminProductRequests.tsx'),

    read(
      '../../components/pharmacies/PharmacyDetailsPageContent/PharmacyCommentsTab.tsx'
    ),

    read('../../components/activity/ActivityHistory.tsx'),
  ]);

  assert.doesNotMatch(detail, /Recorded request history|legacyHistory/);
  assert.match(detail, /<ActivityHistory[\s\S]*?scopeRequestId=\{requestId\}/);

  assert.match(
    comments,
    /resource === 'product request' && effectiveStatus === 'loading'/
  );

  assert.match(
    comments,
    /shown=\{effectiveStatus === 'success' \? comments\.length : 0\}/
  );

  assert.match(
    comments,
    /total=\{effectiveStatus === 'success' \? comments\.length : 0\}/
  );

  assert.match(history, /data \|\| \(scopeRequestId && isLoading\)/);

  assert.match(
    history,
    /scopeRequestId && isLoading \? 0 : \(data\?\.items\.length \?\? 0\)/
  );

  assert.match(
    history,
    /scopeRequestId && isLoading \? 0 : \(data\?\.total \?\? 0\)/
  );
});

//===============================================================

test('request activity change type requires the selected section and uses request icons', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [drawer, route] = await Promise.all([
    read('../../components/activity/ActivityFiltersDrawer.tsx'),

    read(
      '../../app/admin/product-requests/[requestId]/activity/[...filters]/page.tsx'
    ),
  ]);

  assert.match(drawer, /case 'productRequests':\s*return <FilePlus2/);

  assert.match(
    drawer,
    /disabled=\{\s*productRequestScoped && filters\.section !== 'productRequests'\s*\}/
  );

  for (const label of ['status', 'data']) {
    assert.match(
      drawer,
      new RegExp(
        `content: withIcon\\(\\s*'productRequests',\\s*'Product request ${label} changed'`
      )
    );
  }

  assert.match(
    drawer,
    /onChange\(\{ \.\.\.filters, section, action: '', changeType: '' \}\)/
  );

  assert.match(
    route,
    /state\.section === 'productRequests'[\s\S]*?section: '' as const,[\s\S]*?changeType: '' as const/
  );
});

//===============================================================

test('Admin read-only category select renders the saved category icon like Pharmacy', async () => {
  const read = (path: string) =>
    readFile(new URL(path, import.meta.url), 'utf8');

  const [panels, styles] = await Promise.all([
    read('../../components/product-requests/AdminProductRequestPanels.tsx'),

    read(
      '../../components/product-requests/AdminProductRequestPanels.module.css'
    ),
  ]);

  assert.match(
    panels,
    /content: renderCategoryOption\(\s*request\.category\.name,\s*<CategoryIcon\s+name=\{request\.category\.icon\}\s+size=\{16\}\s*\/>\s*\)/
  );

  assert.match(
    panels,
    /content: renderCategoryOption\(\s*'Other category',\s*<Settings size=\{16\} aria-hidden="true" \/>\s*\)/
  );

  assert.match(panels, /\{ value: '', label: 'Not assigned' \}/);

  assert.match(
    panels,
    /values\.categoryMode === 'custom'\s*\? '__custom__'\s*:\s*\(request\.category\?\.id \?\? ''\)/
  );

  assert.match(
    panels,
    /id="request-category"[\s\S]*?disabled\s+required\s+onChange=\{noop\}/
  );

  assert.match(panels, /className=\{css\.optionIcon\}>\{icon\}/);

  assert.match(
    styles,
    /\.optionIcon\s*\{[^}]*width:\s*26px;[^}]*height:\s*26px;[^}]*border-radius:\s*50%;/
  );
});

//===============================================================

test('request category overview and table use the same chip and approved palette', async () => {
  const [overview, table, category, styles, pharmacyStyles] = await Promise.all(
    [
      readFile(
        new URL(
          '../../components/product-requests/AdminProductRequestOverview.tsx',
          import.meta.url
        ),
        'utf8'
      ),

      readFile(
        new URL(
          '../../components/product-requests/ProductRequestsTable.tsx',
          import.meta.url
        ),
        'utf8'
      ),

      readFile(
        new URL(
          '../../components/product-requests/AdminProductRequestCategory.tsx',
          import.meta.url
        ),
        'utf8'
      ),

      readFile(
        new URL(
          '../../components/product-requests/AdminProductRequestsList.module.css',
          import.meta.url
        ),
        'utf8'
      ),

      readFile(
        new URL(
          '../../../../pharmacy/src/components/product-requests/ProductRequestCategory.module.css',
          import.meta.url
        ),
        'utf8'
      ),
    ]
  );

  assert.match(overview, /<AdminProductRequestCategory request=\{request\}/);
  assert.match(table, /<AdminProductRequestCategory request=\{request\}/);
  assert.match(category, /if \(!name\) return <span>—<\/span>/);
  assert.match(category, /css\.categoryIconWrap/);
  assert.match(category, /<CategoryIcon name=\{request\.category\?\.icon\}/);

  for (const name of ['categoryCell', 'categoryText', 'categoryIconWrap']) {
    const pattern = new RegExp(`\\.${name} \\{[^}]+\\}`);

    assert.equal(
      styles.match(pattern)?.[0],
      pharmacyStyles.match(pattern)?.[0]
    );
  }
});

//===============================================================

test('status activity prefers the recorded actor name rather than an invented owner name', async () => {
  const source = await readFile(
    new URL(
      '../../components/product-requests/AdminProductRequestStatusActivity.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(source, /activity\.entry\.actorName \|\|/);
  assert.doesNotMatch(source, /ownerDetail\.name/);
  assert.match(source, /actorNameSource === 'current_owner'/);
  assert.match(source, /current account name/);
});
