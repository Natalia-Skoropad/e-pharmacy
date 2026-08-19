import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
  hasMeaningfulValue,
} from './shared';

import { clearableSchema } from './shared/optional-text.schema';

import {
  pharmacyDocumentUploadSchema,
  pharmacyProfileDocumentSelectionsSchema,
} from './shared/pharmacy-document.schema';

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
  sharedEmailSchema,
  sharedPharmacyNameSchema,
  sharedBankRecipientNameSchema,
  sharedBankNameSchema,
  sharedRequiredAddressSchema,
  sharedRequiredPhoneSchema,
  sharedPictureUrlSchema,
  sharedClearableWorkingHoursSchema,
  sharedClearableTextEditorSchema,
  sharedClearableTaxIdSchema,
  sharedClearableIbanSchema,
  sharedClearablePaymentPurposeSchema,
  sharedExpectedRevisionSchema,
} from './shared-validation.schema';

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
      city: sharedSearchSchema,
      sort: z
        .enum(['newest', 'rating-desc', 'rating-asc', 'name-asc', 'name-desc'])
        .default('newest'),
    })
    .strict()
);

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

const pharmacyProfileUpdateChangesSchema = z.object({
  name: sharedPharmacyNameSchema.optional(),
  address: clearableSchema(sharedRequiredAddressSchema),
  city: clearableSchema(sharedSearchSchema.unwrap()),
  phone: clearableSchema(sharedRequiredPhoneSchema),
  email: clearableSchema(sharedEmailSchema),
  workingHours: sharedClearableWorkingHoursSchema,
  imageUrl: sharedPictureUrlSchema,
  description: sharedClearableTextEditorSchema,
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
});

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

export const uploadMyPharmacyDocumentSchema = pharmacyDocumentUploadSchema;

//===============================================================

export const sendMyPharmacyForVerificationSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

//===============================================================

export type PharmaciesQuery = z.infer<typeof pharmaciesQuerySchema>;
export type PharmacyIdParams = z.infer<typeof pharmacyIdParamsSchema>;
export type PharmacyReviewParams = z.infer<typeof pharmacyReviewParamsSchema>;
export type PharmacyDocumentParams = z.infer<
  typeof pharmacyDocumentParamsSchema
>;

export type PendingPharmacyReviewsQuery = z.infer<
  typeof pendingPharmacyReviewsQuerySchema
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
