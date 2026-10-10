import { z } from 'zod';
import { mongoIdSchema } from './shared';
import { PHARMACY_STATUSES } from '../constants/auth';

//===============================================================

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
});

//===============================================================

export const adminPharmacyDocumentParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
  documentId: mongoIdSchema,
});

//===============================================================

const pharmacyModerationRevision = z.string().datetime({ offset: true });
const pharmacyModerationReason = z.string().trim().min(1).max(1000);
const pharmacyModerationMutationKey = z.string().trim().min(8).max(128);

//===============================================================

export const pharmacyModerationDecisionSchema = z
  .object({
    action: z.enum([
      'approve',
      'request_corrections',
      'block',
      'review_reactivation',
    ]),

    reason: pharmacyModerationReason,
    expectedRevision: pharmacyModerationRevision,
    clientRequestId: pharmacyModerationMutationKey,
  })

  .strict();

//===============================================================

// Backward-compatible paths are thin adapters to the canonical decision service.
export const updateAdminPharmacyStatusSchema = z
  .object({
    status: z.enum([PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.BLOCKED]),
    reason: pharmacyModerationReason,
    expectedRevision: pharmacyModerationRevision,
    clientRequestId: pharmacyModerationMutationKey,
  })

  .strict();

//===============================================================

export const requestAdminPharmacyCorrectionsSchema = z
  .object({
    feedback: pharmacyModerationReason,
    expectedRevision: pharmacyModerationRevision,
    clientRequestId: pharmacyModerationMutationKey,
  })

  .strict();

//===============================================================

export type PharmacyModerationDecisionInput = z.infer<
  typeof pharmacyModerationDecisionSchema
>;

export type RequestAdminPharmacyCorrectionsInput = z.infer<
  typeof requestAdminPharmacyCorrectionsSchema
>;

//===============================================================

export type AdminPharmacyParams = z.infer<typeof pharmacyIdParamsSchema>;

export type UpdateAdminPharmacyStatusInput = z.infer<
  typeof updateAdminPharmacyStatusSchema
>;

export type AdminPharmacyDocumentParams = z.infer<
  typeof adminPharmacyDocumentParamsSchema
>;
