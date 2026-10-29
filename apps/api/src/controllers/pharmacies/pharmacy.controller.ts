import type { Request } from 'express';
import type { z } from 'zod';

import { documentAttachmentDisposition } from '../shared/document-attachment';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  CreatePharmacyDraftInput,
  PharmacyDocumentParams,
  SendMyPharmacyForVerificationInput,
  SubmitMyPharmacyModerationInput,
  UpdateMyPharmacyProfileInput,
  ownedPharmacyDeactivateSchema,
  ownedPharmacyDeleteDraftSchema,
  ownedPharmacyReactivationSchema,
  ownedPharmacyCancellationSchema,
  ownedPharmacyDiscardSchema,
  ownedPharmacyModerationSchema,
  pharmacyPaymentAvailabilityQuerySchema,
} from '../../schemas/pharmacies/pharmacy.schema';

import type { PharmacyDocumentUploadInput } from '../../schemas/shared/pharmacy-document.schema';
import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';

import type {
  OwnedPharmacyRegistryParams,
  OwnedPharmacyDocumentParams,
  ownedPharmacyLifecycleHistoryQuerySchema,
} from '../../schemas/owners/owned-pharmacy-registry.schema';

import {
  getCurrentPharmacySummaryService,
  getMyPharmacyProfileService,
  updateMyPharmacyProfileService,
} from '../../services/pharmacies/pharmacy-owner-profile.service';

import {
  sendMyPharmacyForVerificationService,
  submitMyPharmacyModerationService,
} from '../../services/pharmacies/pharmacy-moderation.service';

import {
  createPrivatePharmacyDocumentUploadService,
  getPrivatePharmacyDocumentContentService,
} from '../../services/pharmacies/pharmacy-document.service';

import { getOrderSalesStatisticsForPharmacyService } from '../../services/orders/order-sales-statistics.service';
import { getPharmacyMembership } from '../../services/pharmacies/pharmacy-membership.service';
import { checkPaymentIdentifierDuplicates } from '../../services/pharmacies/pharmacy-payment-uniqueness.service';
import { createPharmacyDraftService } from '../../services/pharmacies/pharmacy-create.service';

import {
  deactivateOwnedPharmacyService,
  getOwnedPharmacyDeactivationEligibilityService,
} from '../../services/pharmacies/pharmacy-owner-deactivation.service';

import { discardOwnedPharmacyPendingSectionService } from '../../services/pharmacies/pharmacy-owner-pending-discard.service';
import { deleteOwnedPharmacyDraftService } from '../../services/pharmacies/pharmacy-owner-delete-draft.service';
import { listOwnedPharmacyLifecycleHistoryService } from '../../services/pharmacies/pharmacy-lifecycle-history.service';
import { cancelOwnedPharmacyReviewService } from '../../services/pharmacies/pharmacy-owner-review-cancellation.service';
import { requestOwnedPharmacyReactivationService } from '../../services/pharmacies/pharmacy-owner-reactivation.service';
import { listUserPharmacyMemberships } from '../../services/pharmacies/pharmacy-membership.service';

import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/http/apiResponse';
import { httpError } from '../../utils/http/httpError';

//===============================================================

export async function createPharmacyDraft(
  req: Request,
  res: ValidatedResponse<CreatePharmacyDraftInput>
): Promise<void> {
  const result = await createPharmacyDraftService(
    req.user?.id ?? '',
    res.locals.validated.body,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: result.replayed ? HTTP_STATUS.OK : HTTP_STATUS.CREATED,
    data: { pharmacy: result.pharmacy },
  });
}

//===============================================================

// Stage 14.18.10: explicit pharmacy ID on every draft mutation. Never select
// the first pharmacy implicitly when an owner has multiple memberships.
export async function getOwnedPharmacyProfile(
  req: Request,
  res: ValidatedResponse<unknown, OwnedPharmacyRegistryParams>
): Promise<void> {
  const data = await getMyPharmacyProfileService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function requestOwnedPharmacyReactivation(
  req: Request,

  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyReactivationSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await requestOwnedPharmacyReactivationService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyLifecycleHistory(
  req: Request,

  res: ValidatedResponse<
    unknown,
    OwnedPharmacyRegistryParams,
    z.infer<typeof ownedPharmacyLifecycleHistoryQuerySchema>
  >
): Promise<void> {
  const data = await listOwnedPharmacyLifecycleHistoryService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.query.page
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function cancelOwnedPharmacyReview(
  req: Request,

  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyCancellationSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await cancelOwnedPharmacyReviewService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body.type,
    res.locals.validated.body.expectedRevision,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function deleteOwnedPharmacyDraft(
  req: Request,

  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyDeleteDraftSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await deleteOwnedPharmacyDraftService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body.expectedRevision,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getNewPharmacyPaymentAvailability(
  _req: Request,

  res: ValidatedResponse<
    unknown,
    unknown,
    z.infer<typeof pharmacyPaymentAvailabilityQuerySchema>
  >
): Promise<void> {
  const duplicates = await checkPaymentIdentifierDuplicates(
    undefined,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { duplicates },
  });
}

//===============================================================

export async function getOwnedPharmacyPaymentAvailability(
  req: Request,

  res: ValidatedResponse<
    unknown,
    OwnedPharmacyRegistryParams,
    z.infer<typeof pharmacyPaymentAvailabilityQuerySchema>
  >
): Promise<void> {
  const pharmacyId = res.locals.validated.params.pharmacyId;

  const { membershipRole } = await getPharmacyMembership(
    req.user?.id ?? '',
    pharmacyId
  );

  if (membershipRole !== 'owner') {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only the pharmacy owner can check payment data.'
    );
  }

  const duplicates = await checkPaymentIdentifierDuplicates(
    pharmacyId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { duplicates },
  });
}

//===============================================================

export async function updateOwnedPharmacyDraft(
  req: Request,

  res: ValidatedResponse<
    UpdateMyPharmacyProfileInput,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await updateMyPharmacyProfileService(
    req.user?.id ?? '',
    res.locals.validated.body,
    res.locals.requestId,
    res.locals.validated.params.pharmacyId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function submitOwnedPharmacyForVerification(
  req: Request,

  res: ValidatedResponse<
    SendMyPharmacyForVerificationInput,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await sendMyPharmacyForVerificationService(
    req.user?.id ?? '',
    res.locals.requestId,
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body.comment
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function submitOwnedPharmacyForModeration(
  req: Request,
  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyModerationSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const { comment, ...payload } = res.locals.validated.body;

  const data = await submitMyPharmacyModerationService(
    req.user?.id ?? '',
    payload,
    res.locals.requestId,
    res.locals.validated.params.pharmacyId,
    comment
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyDeactivationEligibility(
  req: Request,
  res: ValidatedResponse<unknown, OwnedPharmacyRegistryParams>
): Promise<void> {
  const data = await getOwnedPharmacyDeactivationEligibilityService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function discardOwnedPharmacyPendingSection(
  req: Request,
  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyDiscardSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await discardOwnedPharmacyPendingSectionService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function deactivateOwnedPharmacy(
  req: Request,
  res: ValidatedResponse<
    z.infer<typeof ownedPharmacyDeactivateSchema>,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await deactivateOwnedPharmacyService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId,
    res.locals.validated.body,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacySalesStatistics(
  req: Request,
  res: ValidatedResponse<
    unknown,
    OwnedPharmacyRegistryParams,
    OrderSalesStatisticsQuery
  >
): Promise<void> {
  const pharmacyId = res.locals.validated.params.pharmacyId;

  await getPharmacyMembership(req.user?.id ?? '', pharmacyId);

  const data = await getOrderSalesStatisticsForPharmacyService(
    pharmacyId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function uploadOwnedPharmacyDocument(
  req: Request,

  res: ValidatedResponse<
    PharmacyDocumentUploadInput,
    OwnedPharmacyRegistryParams
  >
): Promise<void> {
  const data = await createPrivatePharmacyDocumentUploadService(
    req.user?.id ?? '',
    res.locals.validated.body,
    res.locals.validated.params.pharmacyId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

/** Download a document only from the explicitly selected owned pharmacy. */
export async function downloadOwnedPharmacyDocument(
  req: Request,
  res: ValidatedResponse<unknown, OwnedPharmacyDocumentParams>
): Promise<void> {
  const { pharmacyId, documentId } = res.locals.validated.params;

  const { document, content } = await getPrivatePharmacyDocumentContentService(
    req.user?.id ?? '',
    documentId,
    pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));

  res.setHeader(
    'Content-Disposition',
    documentAttachmentDisposition(document.name)
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function uploadMyPharmacyDocument(
  req: Request,
  res: ValidatedResponse<PharmacyDocumentUploadInput>
): Promise<void> {
  const input = res.locals.validated.body;

  const data = await createPrivatePharmacyDocumentUploadService(
    req.user?.id ?? '',
    input
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function getMyPharmacyDocument(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyDocumentParams>
): Promise<void> {
  const { documentId } = res.locals.validated.params;

  const { document, content } = await getPrivatePharmacyDocumentContentService(
    req.user?.id ?? '',
    documentId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));

  res.setHeader(
    'Content-Disposition',
    documentAttachmentDisposition(document.name)
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function getCurrentPharmacySummary(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getCurrentPharmacySummaryService(req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getMyPharmacyProfile(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getMyPharmacyProfileService(req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateMyPharmacyProfile(
  req: Request,
  res: ValidatedResponse<UpdateMyPharmacyProfileInput>
): Promise<void> {
  const { body } = res.locals.validated;

  const data = await updateMyPharmacyProfileService(
    req.user?.id ?? '',
    body,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function submitMyPharmacyModeration(
  req: Request,
  res: ValidatedResponse<SubmitMyPharmacyModerationInput>
): Promise<void> {
  const { body } = res.locals.validated;

  const data = await submitMyPharmacyModerationService(
    req.user?.id ?? '',
    body,
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function sendMyPharmacyForVerification(
  req: Request,
  res: ValidatedResponse<SendMyPharmacyForVerificationInput>
): Promise<void> {
  const data = await sendMyPharmacyForVerificationService(
    req.user?.id ?? '',
    res.locals.requestId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listMyPharmacyMemberships(
  req: Request,
  res: ValidatedResponse
) {
  const data = await listUserPharmacyMemberships(req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
