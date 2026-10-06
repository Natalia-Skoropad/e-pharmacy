import type {
  PharmacyGeoPoint,
  PharmacyLocation,
  PharmacyLocationDraft,
} from '@e-pharmacy/types/pharmacies';

import {
  buildAddressError,
  SEARCH_TEXT_PATTERN,
  USER_SEARCH_MAX_LENGTH,
} from '../shared';

//===================================================================

export type PharmacyLocationValidationMode = 'draft' | 'verification';

export type PharmacyLocationValidationErrors = Partial<
  Record<keyof PharmacyLocation, string>
>;

//===================================================================

export const PHARMACY_COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export const PHARMACY_LOCATION_VALIDATION_MESSAGES = {
  required: {
    settlement: 'Settlement is required',
    countryCode: 'Country code is required',
  },

  limits: {
    settlement: `Settlement must be at most ${USER_SEARCH_MAX_LENGTH} characters`,
    region: `Region must be at most ${USER_SEARCH_MAX_LENGTH} characters`,
  },

  format: {
    settlement: 'Settlement contains unsupported characters',
    region: 'Region contains unsupported characters',
    countryCode: 'Country code must contain two uppercase Latin letters',
    geo: 'Geo must be a valid GeoJSON Point with [longitude, latitude]',
  },
} as const;

//===================================================================

function buildLocationTextError(
  value: string | undefined,
  field: 'settlement' | 'region',
  options: Readonly<{ required?: boolean }> = {}
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    if (!options.required || field === 'region') return '';
    return PHARMACY_LOCATION_VALIDATION_MESSAGES.required.settlement;
  }

  if (normalized.length > USER_SEARCH_MAX_LENGTH) {
    return PHARMACY_LOCATION_VALIDATION_MESSAGES.limits[field];
  }

  if (!SEARCH_TEXT_PATTERN.test(normalized)) {
    return PHARMACY_LOCATION_VALIDATION_MESSAGES.format[field];
  }

  return '';
}

//===================================================================

function buildCountryCodeError(
  value: string | undefined,
  options: Readonly<{ required?: boolean }> = {}
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return options.required
      ? PHARMACY_LOCATION_VALIDATION_MESSAGES.required.countryCode
      : '';
  }

  return PHARMACY_COUNTRY_CODE_PATTERN.test(normalized)
    ? ''
    : PHARMACY_LOCATION_VALIDATION_MESSAGES.format.countryCode;
}

//===================================================================

function isValidGeoPoint(geo: PharmacyGeoPoint): boolean {
  const [longitude, latitude] = geo.coordinates;

  return (
    geo.type === 'Point' &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

//===================================================================

/**
 * Validates the Stage 13.4.2 location contract without changing persistence.
 * Draft mode permits missing fields; verification requires address,
 * settlement and countryCode. Region and geo remain optional in both modes.
 */
export function validatePharmacyLocation(
  location: PharmacyLocationDraft,
  mode: PharmacyLocationValidationMode = 'draft'
): PharmacyLocationValidationErrors {
  const errors: PharmacyLocationValidationErrors = {};
  const required = mode === 'verification';

  const addressError = buildAddressError(location.address ?? '', { required });
  const settlementError = buildLocationTextError(
    location.settlement,
    'settlement',
    { required }
  );
  const regionError = buildLocationTextError(location.region, 'region');
  const countryCodeError = buildCountryCodeError(location.countryCode, {
    required,
  });

  if (addressError) errors.address = addressError;
  if (settlementError) errors.settlement = settlementError;
  if (regionError) errors.region = regionError;
  if (countryCodeError) errors.countryCode = countryCodeError;

  if (location.geo && !isValidGeoPoint(location.geo)) {
    errors.geo = PHARMACY_LOCATION_VALIDATION_MESSAGES.format.geo;
  }

  return errors;
}

//===================================================================

export function isPharmacyLocationReadyForVerification(
  location: PharmacyLocationDraft
): location is PharmacyLocation {
  return (
    Object.keys(validatePharmacyLocation(location, 'verification')).length === 0
  );
}
