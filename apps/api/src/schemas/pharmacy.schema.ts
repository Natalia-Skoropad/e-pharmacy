import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
  hasMeaningfulValue,
} from './shared';

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
  sharedOptionalWorkingHoursSchema,
  sharedOptionalTextEditorSchema,
  sharedOptionalTaxIdSchema,
  sharedOptionalIbanSchema,
  sharedOptionalPaymentPurposeSchema,
} from './shared-validation.schema';

//===============================================================

const pharmaciesPerPageSchema = createPerPageSchema({
  defaultValue: 12,
  max: 100,
});

//===============================================================

export const pharmaciesQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
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

export const updateMyPharmacyProfileSchema = z
  .object({
    name: sharedPharmacyNameSchema.optional(),
    address: sharedRequiredAddressSchema.optional(),
    city: sharedSearchSchema,
    phone: sharedRequiredPhoneSchema.optional(),
    email: sharedEmailSchema.optional(),
    workingHours: sharedOptionalWorkingHoursSchema,
    imageUrl: sharedPictureUrlSchema,
    description: sharedOptionalTextEditorSchema,
    documents: pharmacyProfileDocumentSelectionsSchema.optional(),

    bankDetails: z
      .object({
        recipientName: sharedBankRecipientNameSchema.optional(),
        taxId: sharedOptionalTaxIdSchema,
        iban: sharedOptionalIbanSchema,
        bankName: sharedBankNameSchema.optional(),
        receiptEmail: sharedEmailSchema.optional(),
        paymentPurpose: sharedOptionalPaymentPurposeSchema,
      })
      .optional(),
  })

  .refine((data) => Object.values(data).some(hasMeaningfulValue), {
    message: 'At least one field is required',
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
export type PharmacyDocumentParams = z.infer<typeof pharmacyDocumentParamsSchema>;

export type PendingPharmacyReviewsQuery = z.infer<
  typeof pendingPharmacyReviewsQuerySchema
>;

export type UpdateMyPharmacyProfileInput = z.infer<
  typeof updateMyPharmacyProfileSchema
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
