import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isInfoDocumentApproved,
  isInfoDocumentNoIndex,
  type InfoPageData,
} from '@/components/info/config/types';

import { buildPharmacyCanonicalPath } from '@/lib/catalog/pharmacies-catalog-paths';

import {
  isPharmacyNoIndex,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog-filters';

import { buildProductCatalogCanonicalPath } from '@/lib/catalog/product-catalog-paths';

import {
  isProductCatalogNoIndex,
  type ProductCatalogFilters,
} from '@/lib/catalog/product-catalog-filters';

import {
  CLIENT_GUEST_PREFERRED_ROUTES,
  CLIENT_PRIVATE_ROUTE_PREFIXES,
  CLIENT_TOKEN_ACCESS_ROUTES,
  ROUTES,
  buildPharmacyPath,
  buildProductPath,
} from '@/lib/routes';

import {
  createApprovedInfoSitemapEntries,
  ROBOTS_DISALLOW_ROUTES,
  STATIC_SITEMAP_ENTRIES,
} from '@/lib/seo/server/route-policy';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

//===================================================================

function createInfoDocument(
  approvalStatus: 'unreviewed' | 'in_review' | 'approved'
): InfoPageData {
  return {
    path: ROUTES.USER_AGREEMENT,
    title: 'User Agreement',
    description: 'Terms',
    metadata: {
      version: approvalStatus === 'approved' ? '2026-08' : 'draft-2026-08',
      effectiveAt:
        approvalStatus === 'approved'
          ? { iso: '2026-08-18', label: '18 August 2026' }
          : null,
      updatedAt: { iso: '2026-08-18', label: '18 August 2026' },
      contentOwner: approvalStatus === 'approved' ? 'Legal' : null,
      approvalStatus,
      legalEntity: approvalStatus === 'approved' ? 'E-PHARMACY' : null,
      supportRoute: null,
      reviewId: approvalStatus === 'approved' ? 'LEGAL-2026-08' : null,
    },
    sections: [],
  };
}

//===================================================================

test('private, auth and token routes stay out of the static sitemap and remain robots-disallowed', () => {
  const staticPaths = new Set<string>(
    STATIC_SITEMAP_ENTRIES.map((entry) => entry.path)
  );

  for (const route of [
    ...CLIENT_PRIVATE_ROUTE_PREFIXES,
    ...CLIENT_GUEST_PREFERRED_ROUTES,
    ...CLIENT_TOKEN_ACCESS_ROUTES,
  ]) {
    assert.equal(staticPaths.has(route), false);
    assert.equal(ROBOTS_DISALLOW_ROUTES.includes(route), true);
    assert.equal(ROBOTS_DISALLOW_ROUTES.includes(`${route}/`), true);
  }
});

//===================================================================

test('product SEO canonical keeps indexed dimensions and removes noindex noise', () => {
  const filters: ProductCatalogFilters = {
    name: 'aspirin',
    article: '',
    category: 'medicine',
    availability: 'in-stock',
    sort: 'rating-desc',
    page: 4,
  };

  assert.equal(isProductCatalogNoIndex(filters), true);
  assert.equal(
    buildProductCatalogCanonicalPath(filters),
    `${ROUTES.PRODUCTS_CATALOG}/category-medicine`
  );
});

//===================================================================

test('pharmacy SEO canonical keeps the indexed city dimension and removes noindex noise', () => {
  const filters: PharmacyFilters = {
    name: 'health',
    address: 'main street',
    city: 'Kyiv',
    sort: 'rating-desc',
    page: 3,
  };

  assert.equal(isPharmacyNoIndex(filters), true);
  assert.equal(
    buildPharmacyCanonicalPath(filters),
    `${ROUTES.PHARMACIES}/city-kyiv`
  );
});

//===================================================================

test('legal documents become index/sitemap eligible only after complete approval metadata exists', () => {
  const draft = createInfoDocument('unreviewed');
  const approved = createInfoDocument('approved');

  assert.equal(isInfoDocumentApproved(draft), false);
  assert.equal(isInfoDocumentNoIndex(draft), true);

  assert.equal(isInfoDocumentApproved(approved), true);
  assert.equal(isInfoDocumentNoIndex(approved), false);

  assert.deepEqual(
    createApprovedInfoSitemapEntries([approved.path]).map(
      (entry) => entry.path
    ),
    [ROUTES.USER_AGREEMENT]
  );
});

//===================================================================

test('dynamic sitemap/detail URLs reuse the typed canonical entity builders', () => {
  assert.equal(buildProductPath('Pain Relief', ID), `/pain-relief-pr${ID}`);
  assert.equal(buildPharmacyPath('Health Hub', ID), `/health-hub-ph${ID}`);
});
