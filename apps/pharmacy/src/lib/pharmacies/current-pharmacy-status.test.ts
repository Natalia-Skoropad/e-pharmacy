import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getLockedFeatureBannerStatus,
  isPharmacyOperationalStatus,
} from './current-pharmacy-status';

//===================================================================

test('only active and on_moderation pharmacies are operational', () => {
  assert.equal(isPharmacyOperationalStatus('active'), true);
  assert.equal(isPharmacyOperationalStatus('on_moderation'), true);

  assert.equal(isPharmacyOperationalStatus('new'), false);
  assert.equal(isPharmacyOperationalStatus('on_verification'), false);
  assert.equal(isPharmacyOperationalStatus('blocked'), false);
  assert.equal(isPharmacyOperationalStatus(null), false);
  assert.equal(isPharmacyOperationalStatus(undefined), false);
});

//===================================================================

test('blocked remains an explicit locked status instead of falling through to new', () => {
  assert.equal(getLockedFeatureBannerStatus('blocked'), 'blocked');
  assert.equal(getLockedFeatureBannerStatus('new'), 'new');

  assert.equal(
    getLockedFeatureBannerStatus('on_verification'),
    'on_verification'
  );

  assert.equal(getLockedFeatureBannerStatus('active'), null);
  assert.equal(getLockedFeatureBannerStatus('on_moderation'), null);
});
