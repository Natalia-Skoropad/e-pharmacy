import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
  hasMeaningfulValue,
} from '../shared/index';

import { clearableSchema } from '../shared/optional-text.schema';

import {
  pharmacyDocumentUploadSchema,
  pharmacyProfileDocumentSelectionsSchema,
} from '../shared/pharmacy-document.schema';

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
  sharedEmailSchema,
  sharedPharmacyNameSchema,
  sharedBankRecipientNameSchema,
  sharedBankNameSchema,
  sharedRequiredPhoneSchema,
  sharedPictureUrlSchema,
  sharedClearableWorkingHoursSchema,
  sharedClearableTextEditorSchema,
  sharedClearableTaxIdSchema,
  sharedClearableIbanSchema,
  sharedClearablePaymentPurposeSchema,
  sharedExpectedRevisionSchema,
  sharedRequiredAddressSchema,
  sharedWorkingHoursSchema,
  sharedTextEditorSchema,
  sharedTaxIdSchema,
  sharedIbanSchema,
  sharedPaymentPurposeSchema,
} from '../shared/shared-validation.schema';

import {
  pharmacyEditableLocationPatchSchema,
  pharmacyRegionSchema,
  pharmacySettlementSchema,
} from '../shared/pharmacy-location.schema';

import { optionalSchema } from '../shared/optional-text.schema';

//===============================================================

const pharmaciesPerPageSchema = createPerPageSchema({
  defaultValue: 12,
  max: 100,
});

//===============================================================

export const pharmaciesQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: pharmaciesPerPageSchema,
      keyword: sharedSearchSchema,
      nameKeyword: sharedSearchSchema,
      addressKeyword: sharedSearchSchema,
      pharmacyId: mongoIdSchema.optional(),
      settlement: sharedSearchSchema,
      region: sharedSearchSchema,

      sort: z
        .enum(['newest', 'rating-desc', 'rating-asc', 'name-asc', 'name-desc'])
        .default('newest'),
    })

    .strict()
);

//===============================================================

export const ownedPharmacyDiscardSchema = z
  .object({
    section: z.enum(['data', 'about', 'payment', 'documents']),
    field: z.string().min(1).max(32),
    expectedRevision: sharedExpectedRevisionSchema,
  })

  .strict();

//===============================================================

export const ownedPharmacyReactivationSchema = z
  .object({
    expectedRevision: sharedExpectedRevisionSchema,
    reason: z.string().trim().min(1).max(500),
  })

  .strict();

//===============================================================

export const ownedPharmacyCancellationSchema = z
  .object({
    type: z.enum(['verification', 'moderation', 'reactivation']),
    expectedRevision: sharedExpectedRevisionSchema,
  })

  .strict();

//===============================================================

export const ownedPharmacyDeleteDraftSchema = z
  .object({
    expectedRevision: sharedExpectedRevisionSchema,
  })

  .strict();

//===============================================================

export const pharmacyPaymentAvailabilityQuerySchema = z
  .object({
    taxId: z.string().trim().max(10).optional(),
    iban: z.string().trim().max(34).optional(),
    receiptEmail: z.string().trim().max(254).optional(),
  })

  .strict();

//===============================================================

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
});

//===============================================================

export const pharmacyReviewParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
  reviewId: mongoIdSchema,
});

//===============================================================

export const pharmacyDocumentParamsSchema = z.object({
  documentId: mongoIdSchema,
});

//===============================================================

export const pendingPharmacyReviewsQuerySchema = z.preprocess(
  normalizePaginationQuery,

  z.object({
    page: positivePageSchema,
    perPage: pharmaciesPerPageSchema,
  })
);

//===============================================================

export const moderatePharmacyReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

//===============================================================

export const createPharmacyReviewSchema = z.object({
  rating: sharedReviewRatingSchema,
  comment: sharedReviewCommentSchema,
});

//===============================================================

const pharmacyProfileUpdateChangesSchema = z
  .object({
    name: sharedPharmacyNameSchema.optional(),
    location: pharmacyEditableLocationPatchSchema.optional(),
    phone: clearableSchema(sharedRequiredPhoneSchema),
    email: clearableSchema(sharedEmailSchema),

    workingHours: sharedClearableWorkingHoursSchema,
    imageUrl: sharedPictureUrlSchema,
    description: sharedClearableTextEditorSchema,
    shortDescription: clearableSchema(z.string().trim().min(10).max(200)),
    documents: pharmacyProfileDocumentSelectionsSchema.optional(),

    bankDetails: z
      .object({
        recipientName: clearableSchema(sharedBankRecipientNameSchema),
        taxId: sharedClearableTaxIdSchema,
        iban: sharedClearableIbanSchema,
        bankName: clearableSchema(sharedBankNameSchema),
        receiptEmail: clearableSchema(sharedEmailSchema),
        paymentPurpose: sharedClearablePaymentPurposeSchema,
      })

      .optional(),
  })
  .strict();

//===============================================================

// Initial creation is a partial, validated draft. The UI must reuse the same
// UUID when retrying a request; null and admin-controlled fields are rejected.
export const createPharmacyDraftSchema = z
  .object({
    clientRequestId: z.string().trim().uuid(),

    name: sharedPharmacyNameSchema.min(
      10,
      'Pharmacy name must be at least 10 characters'
    ),

    location: z
      .object({
        address: optionalSchema(sharedRequiredAddressSchema),
        settlement: optionalSchema(pharmacySettlementSchema),
        region: optionalSchema(pharmacyRegionSchema),
      })

      .strict()
      .optional(),

    phone: optionalSchema(sharedRequiredPhoneSchema),
    email: optionalSchema(sharedEmailSchema),
    workingHours: optionalSchema(sharedWorkingHoursSchema),
    imageUrl: optionalSchema(sharedPictureUrlSchema),
    description: optionalSchema(sharedTextEditorSchema),
    shortDescription: optionalSchema(z.string().trim().min(10).max(200)),

    bankDetails: z
      .object({
        recipientName: optionalSchema(sharedBankRecipientNameSchema),
        taxId: optionalSchema(sharedTaxIdSchema),
        iban: optionalSchema(sharedIbanSchema),
        bankName: optionalSchema(sharedBankNameSchema),
        receiptEmail: optionalSchema(sharedEmailSchema),
        paymentPurpose: optionalSchema(sharedPaymentPurposeSchema),
      })

      .strict()
      .optional(),
  })

  .strict();

//===============================================================

export const updateMyPharmacyProfileSchema = pharmacyProfileUpdateChangesSchema
  .extend({ expectedRevision: sharedExpectedRevisionSchema })

  .refine(
    (data) =>
      Object.entries(data).some(
        ([key, value]) =>
          key !== 'expectedRevision' && hasMeaningfulValue(value)
      ),

    { message: 'At least one field is required' }
  );

//===============================================================

export const submitMyPharmacyModerationSchema = z.object({
  changes: pharmacyProfileUpdateChangesSchema,
  expectedRevision: sharedExpectedRevisionSchema,
});

//===============================================================

// Explicit pharmacy actions require a short note for the administrator.
export const ownedPharmacyModerationSchema =
  submitMyPharmacyModerationSchema.extend({
    comment: z.string().trim().min(1).max(500),
  });

export const ownedPharmacyVerificationSchema = z.object({
  comment: z.string().trim().min(1).max(500),
});

export const ownedPharmacyDeactivateSchema = z.object({
  reason: z.string().trim().min(2).max(1000),
  expectedRevision: sharedExpectedRevisionSchema,
});

//===============================================================

export const uploadMyPharmacyDocumentSchema = pharmacyDocumentUploadSchema;

//===============================================================

export const sendMyPharmacyForVerificationSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

//===============================================================

export type PharmaciesQuery = z.infer<typeof pharmaciesQuerySchema>;
export type PharmacyIdParams = z.infer<typeof pharmacyIdParamsSchema>;
export type PharmacyReviewParams = z.infer<typeof pharmacyReviewParamsSchema>;

//===============================================================

export type PharmacyDocumentParams = z.infer<
  typeof pharmacyDocumentParamsSchema
>;

export type PendingPharmacyReviewsQuery = z.infer<
  typeof pendingPharmacyReviewsQuerySchema
>;

export type CreatePharmacyDraftInput = z.infer<
  typeof createPharmacyDraftSchema
>;

export type UpdateMyPharmacyProfileInput = z.infer<
  typeof updateMyPharmacyProfileSchema
>;

export type SubmitMyPharmacyModerationInput = z.infer<
  typeof submitMyPharmacyModerationSchema
>;

export type SendMyPharmacyForVerificationInput = z.infer<
  typeof sendMyPharmacyForVerificationSchema
>;

export type CreatePharmacyReviewInput = z.infer<
  typeof createPharmacyReviewSchema
>;

export type ModeratePharmacyReviewInput = z.infer<
  typeof moderatePharmacyReviewSchema
>;
