import type { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { pharmacyLocationDraftSchema } from '../schemas/shared/pharmacy-location.schema';
import type {
  PharmacyGeoPoint,
  PharmacyLocationDraft,
} from '../types/pharmacy';

//===============================================================

const DEFAULT_PHARMACY_COUNTRY_CODE = 'UA';
const LOCATION_TEXT_INDEX_NAME = 'pharmacy_location_text';
const LOCATION_SETTLEMENT_INDEX_NAME = 'pharmacy_location_settlement';

//===============================================================

type LegacyPharmacyLocationRow = Readonly<{
  _id: Types.ObjectId;
  address?: unknown;
  city?: unknown;
  location?: unknown;
}>;

type PharmacyIndexDescription = Readonly<{
  key?: unknown;
  weights?: unknown;
}>;

type MigrationPlan = Readonly<{
  location: PharmacyLocationDraft;
  invalid: boolean;
  missingAddress: boolean;
  missingSettlement: boolean;
  alreadyMigrated: boolean;
}>;

export type PharmacyLocationMigrationResult = Readonly<{
  totalPharmacies: number;
  migrated: number;
  missingAddress: number;
  missingSettlement: number;
  alreadyMigrated: number;
  invalid: number;
}>;

//===============================================================

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

//===============================================================

function normalizeOptionalString(value: unknown): {
  value?: string;
  invalid: boolean;
} {
  if (value === undefined || value === null) return { invalid: false };
  if (typeof value !== 'string') return { invalid: true };

  const normalized = value.trim();
  return normalized
    ? { value: normalized, invalid: false }
    : { invalid: false };
}

//===============================================================

function parseGeo(value: unknown): {
  value?: PharmacyGeoPoint;
  invalid: boolean;
} {
  if (value === undefined || value === null) return { invalid: false };
  if (typeof value !== 'object' || Array.isArray(value))
    return { invalid: true };

  const geo = value as Record<string, unknown>;
  const coordinates = geo.coordinates;

  if (
    geo.type !== 'Point' ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    typeof coordinates[0] !== 'number' ||
    typeof coordinates[1] !== 'number' ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -180 ||
    coordinates[0] > 180 ||
    coordinates[1] < -90 ||
    coordinates[1] > 90
  ) {
    return { invalid: true };
  }

  return {
    value: {
      type: 'Point',
      coordinates: [coordinates[0], coordinates[1]],
    },
    invalid: false,
  };
}

//===============================================================

function parseExistingLocation(value: unknown): {
  location: PharmacyLocationDraft;
  invalid: boolean;
  exists: boolean;
} {
  if (value === undefined || value === null) {
    return { location: {}, invalid: false, exists: false };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { location: {}, invalid: true, exists: true };
  }

  const raw = value as Record<string, unknown>;
  const address = normalizeOptionalString(raw.address);
  const settlement = normalizeOptionalString(raw.settlement);
  const region = normalizeOptionalString(raw.region);
  const countryCode = normalizeOptionalString(raw.countryCode);
  const geo = parseGeo(raw.geo);

  const invalidCountryCode = Boolean(
    countryCode.value && !/^[A-Z]{2}$/.test(countryCode.value)
  );

  if (
    address.invalid ||
    settlement.invalid ||
    region.invalid ||
    countryCode.invalid ||
    invalidCountryCode ||
    geo.invalid
  ) {
    return { location: {}, invalid: true, exists: true };
  }

  return {
    location: {
      ...(address.value ? { address: address.value } : {}),
      ...(settlement.value ? { settlement: settlement.value } : {}),
      ...(region.value ? { region: region.value } : {}),
      ...(countryCode.value ? { countryCode: countryCode.value } : {}),
      ...(geo.value ? { geo: geo.value } : {}),
    },
    invalid: false,
    exists: true,
  };
}

//===============================================================

/**
 * Builds the Stage 13.4.3 backfill plan from explicit persisted fields only.
 * In particular, `address` is copied verbatim (apart from schema-style trim)
 * and is never inspected to discover a settlement or region.
 */
export function buildLegacyPharmacyLocationMigrationPlan(
  source: Readonly<{
    address?: unknown;
    city?: unknown;
    location?: unknown;
  }>
): MigrationPlan {
  const legacyAddress = normalizeOptionalString(source.address);
  const legacySettlement = normalizeOptionalString(source.city);
  const existing = parseExistingLocation(source.location);

  if (legacyAddress.invalid || legacySettlement.invalid || existing.invalid) {
    return {
      location: existing.location,
      invalid: true,
      missingAddress: !existing.location.address,
      missingSettlement: !existing.location.settlement,
      alreadyMigrated: false,
    };
  }

  if (
    legacyAddress.value &&
    existing.location.address &&
    legacyAddress.value !== existing.location.address
  ) {
    return {
      location: existing.location,
      invalid: true,
      missingAddress: false,
      missingSettlement: !existing.location.settlement,
      alreadyMigrated: false,
    };
  }

  if (
    legacySettlement.value &&
    existing.location.settlement &&
    legacySettlement.value !== existing.location.settlement
  ) {
    return {
      location: existing.location,
      invalid: true,
      missingAddress: !existing.location.address,
      missingSettlement: false,
      alreadyMigrated: false,
    };
  }

  const location: PharmacyLocationDraft = {
    ...existing.location,
    ...(existing.location.address
      ? {}
      : legacyAddress.value
        ? { address: legacyAddress.value }
        : {}),
    ...(existing.location.settlement
      ? {}
      : legacySettlement.value
        ? { settlement: legacySettlement.value }
        : {}),
    countryCode: existing.location.countryCode ?? DEFAULT_PHARMACY_COUNTRY_CODE,
  };

  const validation = pharmacyLocationDraftSchema.safeParse(location);

  if (!validation.success) {
    return {
      location,
      invalid: true,
      missingAddress: !location.address,
      missingSettlement: !location.settlement,
      alreadyMigrated: false,
    };
  }

  const hasLegacyPersistenceFields =
    hasOwn(source, 'address') || hasOwn(source, 'city');

  const alreadyMigrated =
    existing.exists &&
    !hasLegacyPersistenceFields &&
    existing.location.countryCode !== undefined;

  return {
    location: validation.data,
    invalid: false,
    missingAddress: !validation.data.address,
    missingSettlement: !validation.data.settlement,
    alreadyMigrated,
  };
}

//===============================================================

function getIndexKeyEntries(
  index: PharmacyIndexDescription
): Array<[string, unknown]> {
  const key = index.key;

  if (!key || typeof key !== 'object' || Array.isArray(key)) {
    return [];
  }

  return Object.entries(key as Record<string, unknown>);
}

//===============================================================

function getTextIndexFields(index: PharmacyIndexDescription): string[] {
  const weights = index.weights;

  if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
    return [];
  }

  return Object.keys(weights).sort();
}

//===============================================================

function isLegacyLocationIndex(index: PharmacyIndexDescription): boolean {
  const keys = getIndexKeyEntries(index).map(([key]) => key);
  const textFields = getTextIndexFields(index);

  return (
    keys.includes('address') ||
    keys.includes('city') ||
    textFields.includes('address') ||
    textFields.includes('city')
  );
}

//===============================================================

function hasExactIndexKeys(
  index: PharmacyIndexDescription,
  expected: Readonly<Record<string, 1 | 'text'>>
): boolean {
  const wanted = Object.entries(expected);

  if (
    wanted.length > 0 &&
    wanted.every(([, direction]) => direction === 'text')
  ) {
    const expectedTextFields = wanted.map(([key]) => key).sort();
    const actualTextFields = getTextIndexFields(index);

    return (
      actualTextFields.length === expectedTextFields.length &&
      expectedTextFields.every(
        (field, position) => actualTextFields[position] === field
      )
    );
  }

  const actual = getIndexKeyEntries(index);

  return (
    actual.length === wanted.length &&
    wanted.every(([key, direction], position) => {
      const current = actual[position];
      return current?.[0] === key && current[1] === direction;
    })
  );
}

//===============================================================

async function ensureNamedIndex(
  expected: Readonly<Record<string, 1 | 'text'>>,
  name: string
): Promise<void> {
  const indexes = await Pharmacy.collection.listIndexes().toArray();
  const exact = indexes.find((index) => hasExactIndexKeys(index, expected));

  if (exact?.name === name) return;

  if (exact?.name && exact.name !== '_id_') {
    await Pharmacy.collection.dropIndex(exact.name);
  }

  const conflictingName = indexes.find(
    (index) => index.name === name && !hasExactIndexKeys(index, expected)
  );

  if (conflictingName?.name) {
    await Pharmacy.collection.dropIndex(conflictingName.name);
  }

  await Pharmacy.collection.createIndex(expected, { name });
}

//===============================================================

async function migratePharmacyLocationIndexes(): Promise<void> {
  const indexes = await Pharmacy.collection.listIndexes().toArray();

  for (const index of indexes) {
    if (index.name && index.name !== '_id_' && isLegacyLocationIndex(index)) {
      await Pharmacy.collection.dropIndex(index.name);
    }
  }

  await ensureNamedIndex(
    {
      name: 'text',
      'location.address': 'text',
      'location.settlement': 'text',
    },
    LOCATION_TEXT_INDEX_NAME
  );

  await ensureNamedIndex(
    { 'location.settlement': 1 },
    LOCATION_SETTLEMENT_INDEX_NAME
  );
}

//===============================================================

export async function migratePharmacyLocations(): Promise<PharmacyLocationMigrationResult> {
  const rows = (await Pharmacy.collection
    .find({}, { projection: { _id: 1, address: 1, city: 1, location: 1 } })
    .toArray()) as unknown as LegacyPharmacyLocationRow[];

  let migrated = 0;
  let missingAddress = 0;
  let missingSettlement = 0;
  let alreadyMigrated = 0;
  let invalid = 0;

  for (const row of rows) {
    const plan = buildLegacyPharmacyLocationMigrationPlan(row);

    if (plan.missingAddress) missingAddress += 1;
    if (plan.missingSettlement) missingSettlement += 1;

    if (plan.invalid) {
      invalid += 1;
      continue;
    }

    if (plan.alreadyMigrated) {
      alreadyMigrated += 1;
      continue;
    }

    await Pharmacy.collection.updateOne(
      { _id: row._id },
      {
        $set: { location: plan.location },
        $unset: { address: '', city: '' },
      }
    );

    migrated += 1;
  }

  await migratePharmacyLocationIndexes();

  return {
    totalPharmacies: rows.length,
    migrated,
    missingAddress,
    missingSettlement,
    alreadyMigrated,
    invalid,
  };
}
