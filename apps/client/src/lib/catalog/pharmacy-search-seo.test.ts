import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPharmacyCanonicalPath,
  buildPharmacyPath,
  getPharmaciesSeoContent,
  getPharmacyDescription,
  getPharmacySocialDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySegments,
  shouldShowPharmaciesSeoText,
} from './pharmacies-catalog';

//===================================================================

const pharmacyId = '507f1f77bcf86cd799439011';
const name = 'Care Pharmacy';

//===================================================================

test('selected pharmacy generates its name in the page title and SEO copy', () => {
  const filters = parsePharmacySegments({
    segments: [`pharmacy-id-${pharmacyId}`],
  }).filters;

  assert.equal(getPharmacyTitle(filters, name), name);
  assert.match(getPharmacyDescription(filters, name), /Care Pharmacy/);
  assert.match(getPharmaciesSeoContent(filters, name).intro, /Care Pharmacy/);
  assert.equal(shouldShowPharmaciesSeoText(filters), true);
  assert.equal(isPharmacyNoIndex(filters), false);

  assert.equal(
    buildPharmacyCanonicalPath(filters),
    `/pharmacies/pharmacy-id-${pharmacyId}`
  );
});

//===================================================================

test('pharmacy and location filters combine without dropping either segment', () => {
  const url = `/pharmacies/pharmacy-id-${pharmacyId}/location-lviv/region-lvivska`;

  const { filters, isCanonical } = parsePharmacySegments({
    segments: url.replace('/pharmacies/', '').split('/'),
  });

  assert.equal(isCanonical, true);
  assert.equal(filters.pharmacyId, pharmacyId);
  assert.equal(filters.settlement, 'lviv');
  assert.equal(buildPharmacyPath(filters), url);
  assert.match(getPharmacyTitle(filters, name), /Care Pharmacy.*[Ll]viv/);
  assert.match(getPharmacyDescription(filters, name), /Care Pharmacy/);
  assert.match(getPharmaciesSeoContent(filters, name).intro, /[Ll]viv/);
  assert.equal(shouldShowPharmaciesSeoText(filters), true);
  assert.equal(isPharmacyNoIndex(filters), false);
  assert.equal(buildPharmacyCanonicalPath(filters), url);
});

//===================================================================

test('a missing public pharmacy name never exposes its internal ID as a title', () => {
  const filters = parsePharmacySegments({
    segments: [`pharmacy-id-${pharmacyId}`],
  }).filters;

  assert.equal(getPharmacyTitle(filters), 'Selected pharmacy');
  assert.doesNotMatch(getPharmacyDescription(filters), /507f1f77/);
});

//===================================================================

test('selected pharmacy social copy matches all visible SEO paragraphs and location', () => {
  const filters = parsePharmacySegments({
    segments: [
      `pharmacy-id-${pharmacyId}`,
      'location-dnipro',
      'region-dnipropetrovsk-region',
    ],
  }).filters;

  const content = getPharmaciesSeoContent(filters, name);
  const preview = getPharmacySocialDescription(filters, name);

  assert.equal(
    preview,
    [content.intro, content.comparison, content.ordering].join(' ')
  );

  assert.match(preview, /Care Pharmacy in Dnipro/);
  assert.match(getPharmacyTitle(filters, name), /Care Pharmacy in Dnipro/);
  assert.doesNotMatch(preview, /507f1f77/);
});

//===================================================================

test('sort and paginated selected pharmacy pages stay non-indexed and canonicalize to the primary selection', () => {
  const selected = parsePharmacySegments({
    segments: [
      `pharmacy-id-${pharmacyId}`,
      'location-dnipro',
      'region-dnipropetrovsk-region',
      'sort-rating-desc',
      'page-2',
    ],
  }).filters;

  assert.equal(isPharmacyNoIndex(selected), true);

  assert.equal(
    buildPharmacyCanonicalPath(selected),
    `/pharmacies/pharmacy-id-${pharmacyId}/location-dnipro/region-dnipropetrovsk-region`
  );
});
