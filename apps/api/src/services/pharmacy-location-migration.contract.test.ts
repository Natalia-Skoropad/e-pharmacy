import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  buildLegacyPendingModerationMigrationPlan,
  buildLegacyPharmacyLocationMigrationPlan,
} from './pharmacy-location-migration.service';

//===============================================================

const source = readFileSync(
  resolve(process.cwd(), 'src/services/pharmacy-location-migration.service.ts'),
  'utf8'
);

//===============================================================

test('Stage 13.4.3 copies explicit legacy city/address without parsing the address', () => {
  assert.deepEqual(
    buildLegacyPharmacyLocationMigrationPlan({
      address: '108 Medical Lane',
      city: 'Cherkasy',
    }),
    {
      location: {
        address: '108 Medical Lane',
        settlement: 'Cherkasy',
        countryCode: 'UA',
      },
      invalid: false,
      missingAddress: false,
      missingSettlement: false,
      alreadyMigrated: false,
    }
  );

  assert.deepEqual(
    buildLegacyPharmacyLocationMigrationPlan({
      address: '108 Medical Lane, Kyiv',
      city: 'Cherkasy',
    }).location,
    {
      address: '108 Medical Lane, Kyiv',
      settlement: 'Cherkasy',
      countryCode: 'UA',
    }
  );

  assert.doesNotMatch(source, /address\s*\.\s*split\s*\(/);
  assert.doesNotMatch(source, /address\s*\.\s*includes\s*\(/);
  assert.doesNotMatch(source, /city detection|infer(?:red)? region/i);
});

//===============================================================

test('Stage 13.4.3 preserves known canonical metadata and is idempotent', () => {
  const plan = buildLegacyPharmacyLocationMigrationPlan({
    location: {
      address: '10 Pharmacy Street',
      settlement: 'Odesa',
      region: 'Odesa Oblast',
      countryCode: 'UA',
      geo: { type: 'Point', coordinates: [30.7233, 46.4825] },
    },
  });

  assert.equal(plan.invalid, false);
  assert.equal(plan.alreadyMigrated, true);
  assert.equal(plan.missingAddress, false);
  assert.equal(plan.missingSettlement, false);

  assert.deepEqual(plan.location, {
    address: '10 Pharmacy Street',
    settlement: 'Odesa',
    region: 'Odesa Oblast',
    countryCode: 'UA',
    geo: { type: 'Point', coordinates: [30.7233, 46.4825] },
  });
});

//===============================================================

test('Stage 13.4.3 adds UA to a canonical draft that does not have a country code yet', () => {
  const plan = buildLegacyPharmacyLocationMigrationPlan({
    location: {
      address: '10 Pharmacy Street',
      settlement: 'Odesa',
    },
  });

  assert.equal(plan.invalid, false);
  assert.equal(plan.alreadyMigrated, false);

  assert.deepEqual(plan.location, {
    address: '10 Pharmacy Street',
    settlement: 'Odesa',
    countryCode: 'UA',
  });
});

//===============================================================

test('Stage 13.4.3 reports conflicting persisted values as invalid instead of guessing', () => {
  const plan = buildLegacyPharmacyLocationMigrationPlan({
    address: 'Legacy address',
    city: 'Cherkasy',

    location: {
      address: 'Canonical address',
      settlement: 'Cherkasy',
      countryCode: 'UA',
    },
  });

  assert.equal(plan.invalid, true);
  assert.equal(plan.alreadyMigrated, false);
});

//===============================================================

test('Stage 13.4.3 reports malformed legacy location values as invalid', () => {
  const plan = buildLegacyPharmacyLocationMigrationPlan({
    address: 'short',
    city: 'Cherkasy',
  });

  assert.equal(plan.invalid, true);
  assert.equal(plan.alreadyMigrated, false);
});

//===============================================================

test('Stage 13.4.7 migrates legacy pending moderation address/city into one canonical location snapshot', () => {
  const plan = buildLegacyPendingModerationMigrationPlan({
    approvedLocation: {
      address: '10 Pharmacy Street',
      settlement: 'Odesa',
      region: 'Odesa region',
      countryCode: 'UA',
    },

    pendingModeration: {
      city: 'Bolhrad',
      phone: '+380501234567',
    },
  });

  assert.equal(plan.invalid, false);
  assert.equal(plan.shouldUpdate, true);

  assert.deepEqual(plan.pendingModeration, {
    location: {
      address: '10 Pharmacy Street',
      settlement: 'Bolhrad',
      region: 'Odesa region',
      countryCode: 'UA',
    },
    phone: '+380501234567',
  });
});

//===============================================================

test('Stage 13.4.7 removes persisted pending legacy fields without overwriting an existing canonical location', () => {
  const plan = buildLegacyPendingModerationMigrationPlan({
    approvedLocation: {
      address: '10 Pharmacy Street',
      settlement: 'Odesa',
      countryCode: 'UA',
    },

    pendingModeration: {
      address: 'Legacy address',
      city: 'Legacy city',

      location: {
        address: '25 Medical Lane',
        settlement: 'Reni',
        countryCode: 'UA',
      },
      description: 'Pending description',
    },
  });

  assert.equal(plan.invalid, false);
  assert.equal(plan.shouldUpdate, true);

  assert.deepEqual(plan.pendingModeration, {
    location: {
      address: '25 Medical Lane',
      settlement: 'Reni',
      countryCode: 'UA',
    },
    description: 'Pending description',
  });
});

//===============================================================

test('Stage 13.4.7 pending moderation cleanup is a no-op for canonical records', () => {
  const plan = buildLegacyPendingModerationMigrationPlan({
    approvedLocation: {
      address: '10 Pharmacy Street',
      settlement: 'Odesa',
      countryCode: 'UA',
    },

    pendingModeration: {
      location: {
        address: '25 Medical Lane',
        settlement: 'Reni',
        countryCode: 'UA',
      },
    },
  });

  assert.deepEqual(plan, { shouldUpdate: false, invalid: false });
});
