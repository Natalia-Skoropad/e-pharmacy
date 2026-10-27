import { z } from 'zod';

import {
  PHARMACY_LOCATION_NAME_PATTERN,
  USER_SEARCH_MAX_LENGTH,
} from '../../constants/shared/validation';

import { clearableSchema, optionalSchema } from './optional-text.schema';
import { sharedRequiredAddressSchema } from './shared-validation.schema';

//===============================================================

export const pharmacySettlementSchema = z
  .string()
  .trim()
  .min(2, 'Settlement must be at least 2 characters')

  .max(
    USER_SEARCH_MAX_LENGTH,
    `Settlement must be at most ${USER_SEARCH_MAX_LENGTH} characters`
  )

  .regex(
    PHARMACY_LOCATION_NAME_PATTERN,
    'Use Latin letters, spaces and single hyphens only'
  );

//===============================================================

const pharmacyRegionValueSchema = z
  .string()
  .trim()
  .min(2, 'Region must be at least 2 characters')

  .max(
    USER_SEARCH_MAX_LENGTH,
    `Region must be at most ${USER_SEARCH_MAX_LENGTH} characters`
  )

  .regex(
    PHARMACY_LOCATION_NAME_PATTERN,
    'Use Latin letters, spaces and single hyphens only'
  );

//===============================================================

export const pharmacyRegionSchema = pharmacyRegionValueSchema;

//===============================================================

const requiredCountryCodeSchema = z
  .string()
  .trim()
  .min(1, 'Country code is required')
  .regex(/^[A-Z]{2}$/, 'Country code must contain two uppercase Latin letters');

//===============================================================

export const pharmacyGeoPointSchema = z
  .object({
    type: z.literal('Point'),

    coordinates: z.tuple([
      z.number().finite().min(-180).max(180),
      z.number().finite().min(-90).max(90),
    ]),
  })

  .strict();

//===============================================================

/** Complete location required before a pharmacy is sent for verification. */
export const pharmacyLocationSchema = z
  .object({
    address: sharedRequiredAddressSchema,
    settlement: pharmacySettlementSchema,
    region: pharmacyRegionSchema,
    countryCode: requiredCountryCodeSchema,
    geo: pharmacyGeoPointSchema.optional(),
  })

  .strict();

//===============================================================

/** Incomplete location accepted while the pharmacy remains a new draft. */
export const pharmacyLocationDraftSchema = pharmacyLocationSchema
  .partial()

  .extend({
    // Preserve legacy incomplete/blank region values in draft and migration flows.
    region: optionalSchema(pharmacyRegionValueSchema),
  });

//===============================================================

/** Owner-editable location patch. Country and geo remain system-managed. */
export const pharmacyEditableLocationPatchSchema = z
  .object({
    address: clearableSchema(sharedRequiredAddressSchema),
    settlement: clearableSchema(pharmacySettlementSchema),
    region: clearableSchema(pharmacyRegionValueSchema),
  })

  .strict()

  .refine(
    (value) =>
      Object.values(value).some((fieldValue) => fieldValue !== undefined),
    { message: 'At least one location field is required' }
  );
