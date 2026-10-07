import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('owner detail route is protected by pharmacyOwners.view and no longer renders audit details', () => {
  const page = read('../../app/admin/pharmacy-owners/[ownerId]/page.tsx');

  assert.match(page, /ADMIN_PERMISSIONS\.pharmacyOwners\.view/);
  assert.match(page, /PharmacyOwnerDetailsPageContent/);
  assert.match(page, /parseAdminPharmacyOwnerDetailSearchParams/);
  assert.doesNotMatch(page, /ADMIN_PERMISSIONS\.audit\.view/);
  assert.doesNotMatch(page, /ActivityPharmacyOwnerDetails/);
});

//===================================================================

test('owner detail implements account lifecycle actions with a required reason and conflict-safe feedback', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(
    detail,
    /detail\.status === ['"]blocked['"] \? ['"]active['"] : ['"]blocked['"]/
  );

  assert.match(detail, /Deactivate owner/);
  assert.match(detail, /Activate owner/);
  assert.match(detail, /Reason is required\./);
  assert.match(detail, /OWNER_STATUS_REASON_MAX_LENGTH = 500/);
  assert.match(detail, /error\.httpStatus === 409/);
  assert.match(detail, /active order/);
  assert.match(detail, /updateAdminPharmacyOwnerStatus/);
  assert.match(detail, /const refreshed = await loadDetail\(\)/);
  assert.match(detail, /setDetail\(refreshed\)/);
  assert.match(detail, /ReasonModal/);
});

//===================================================================

test('owner detail keeps account status separate from linked pharmacy moderation statistics', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(detail, /InfoTooltip/);
  assert.match(detail, /Owner account status/);
  assert.match(detail, /Pharmacy status statistics/);
  assert.match(detail, /PHARMACY_STATUS_PRESENTATION\.on_verification/);
  assert.match(detail, /PHARMACY_STATUS_PRESENTATION\.on_moderation/);
  assert.match(detail, /USER_STATUS_PRESENTATION\[detail\.status\]/);
  assert.match(detail, /They are separate from[\s\S]*owner account status/);
});

//===================================================================

test('owner detail bootstraps tab counters from the detail response instead of loading future tab lists', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(detail, /Pharmacies \(\$\{tabCounts\.pharmacies\}\)/);
  assert.match(detail, /Documents \(\$\{tabCounts\.documents\}\)/);
  assert.match(detail, /Comments \(\$\{tabCounts\.comments\}\)/);
  assert.match(detail, /ZERO_TAB_COUNTS/);
  assert.doesNotMatch(detail, /getAdminPharmacyOwnerPharmacies/);
  assert.doesNotMatch(detail, /getAdminPharmacyOwnerDocuments/);
  assert.doesNotMatch(detail, /getAdminPharmacyOwnerComments/);
});

//===================================================================

test('owner personal information is read-only and has explicit not-found, forbidden, and error states', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(detail, /Personal information/);
  assert.match(detail, /Registration date/);
  assert.match(detail, /Last personal data change/);
  assert.match(detail, /NotFoundPage/);
  assert.match(detail, /loadError === ['"]forbidden['"]/);
  assert.match(detail, /ProfileResourceState/);
  assert.match(detail, /Pharmacy owner details could not be loaded/);
  assert.match(detail, /sideActionOnDesktop/);

  assert.doesNotMatch(
    detail,
    /update.*Profile|save.*Personal|PersonalDataForm/
  );
});

//===================================================================

test('order cancellation reuses the shared reason modal styles and behavior', () => {
  const orderModal = read(
    '../../../../pharmacy/src/components/orders/OrderCancellationModal/OrderCancellationModal.tsx'
  );

  const sharedModal = read(
    '../../../../../packages/ui/src/overlays/ReasonModal/ReasonModal.tsx'
  );

  assert.match(orderModal, /ReasonModal/);
  assert.match(orderModal, /buildOrderRejectionReasonError/);
  assert.match(sharedModal, /CommentInput/);
  assert.match(sharedModal, /MessageSquareText/);
  assert.match(sharedModal, /requestError/);
});
