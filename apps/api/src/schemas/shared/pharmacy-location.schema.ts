import { z } from 'zod';

import {
  SEARCH_TEXT_PATTERN,
  USER_SEARCH_MAX_LENGTH,
} from '../../constants/validation';

import { optionalSchema } from './optional-text.schema';
import { sharedRequiredAddressSchema } from '../shared-validation.schema';

//===============================================================

const requiredSettlementSchema = z
  .string()
  .trim()
  .min(1, 'Settlement is required')

  .max(
    USER_SEARCH_MAX_LENGTH,
    `Settlement must be at most ${USER_SEARCH_MAX_LENGTH} characters`
  )

  .regex(SEARCH_TEXT_PATTERN, 'Settlement contains unsupported characters');

//===============================================================

const optionalRegionSchema = optionalSchema(
  z
    .string()
    .trim()

    .max(
      USER_SEARCH_MAX_LENGTH,
      `Region must be at most ${USER_SEARCH_MAX_LENGTH} characters`
    )

    .regex(SEARCH_TEXT_PATTERN, 'Region contains unsupported characters')
);

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
    settlement: requiredSettlementSchema,
    region: optionalRegionSchema,
    countryCode: requiredCountryCodeSchema,
    geo: pharmacyGeoPointSchema.optional(),
  })
  .strict();

/** Incomplete location accepted while the pharmacy remains a new draft. */
export const pharmacyLocationDraftSchema = pharmacyLocationSchema.partial();
