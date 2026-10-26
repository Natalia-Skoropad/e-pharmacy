import type { Request } from 'express';

import { USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  CreatePharmacyDraftInput,
  CreatePharmacyReviewInput,
  ModeratePharmacyReviewInput,
  PendingPharmacyReviewsQuery,
  PharmaciesQuery,
  PharmacyDocumentParams,
  PharmacyIdParams,
  PharmacyReviewParams,
  SendMyPharmacyForVerificationInput,
  SubmitMyPharmacyModerationInput,
  UpdateMyPharmacyProfileInput,
} from '../../schemas/pharmacies/pharmacy.schema';

import type { PharmacyDocumentUploadInput } from '../../schemas/shared/pharmacy-document.schema';

import type {
  OwnedPharmacyRegistryListQuery,
  OwnedPharmacyRegistryOptionsQuery,
  OwnedPharmacyRegistryParams,
  OwnedPharmacyDocumentParams,
} from '../../schemas/owners/owned-pharmacy-registry.schema';

import {
  getFavoritePharmacyIdsService,
  getFavoritePharmaciesService,
  getPharmaciesService,
  getPharmacyCheckoutDetailsService,
  getPharmacyDetailsService,
  getPharmacyFiltersService,
  getPharmacyOptionsService,
  setFavoritePharmacyService,
} from '../../services/pharmacies/pharmacy-public-catalog.service';

import {
  createPharmacyReviewService,
  getPendingPharmacyReviewsService,
  getPharmacyReviewsService,
  moderatePharmacyReviewService,
} from '../../services/pharmacies/pharmacy-reviews.service';

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

import { createPharmacyDraftService } from '../../services/pharmacies/pharmacy-create.service';

import {
  getOwnedPharmacyDetailService,
  getOwnedPharmacyStatisticsService,
  listOwnedPharmaciesService,
  listOwnedPharmacyOptionsService,
} from '../../services/pharmacies/owned-pharmacy-registry-read.service';

import type { ValidatedResponse } from '../../types/http/validated-request';

import { listUserPharmacyMemberships } from '../../services/pharmacies/pharmacy-membership.service';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

function encodeContentDispositionFilename(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

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
    res.locals.validated.params.pharmacyId
  );

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
    `attachment; filename*=UTF-8''${encodeContentDispositionFilename(document.name)}`
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function listOwnedPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OwnedPharmacyRegistryListQuery>
): Promise<void> {
  const data = await listOwnedPharmaciesService(
    req.user?.id ?? '',
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyStatistics(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getOwnedPharmacyStatisticsService(req.user?.id ?? '');

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listOwnedPharmacyOptions(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OwnedPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listOwnedPharmacyOptionsService(
    req.user?.id ?? '',
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyDetail(
  req: Request,
  res: ValidatedResponse<unknown, OwnedPharmacyRegistryParams>
): Promise<void> {
  const data = await getOwnedPharmacyDetailService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
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
    `attachment; filename*=UTF-8''${encodeContentDispositionFilename(document.name)}`
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

export async function getPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;

  const data = await getPharmaciesService(
    query,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyFilters(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyFiltersService();

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOptions(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyOptionsService();

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacyIds(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getFavoritePharmacyIdsService(req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getFavoritePharmaciesService(query, req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyDetails(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;

  const data = await getPharmacyDetailsService(
    pharmacyId,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyCheckoutDetails(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyCheckoutDetailsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPendingPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, PendingPharmacyReviewsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getPendingPharmacyReviewsService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyReviewsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createPharmacyReview(
  req: Request,
  res: ValidatedResponse<CreatePharmacyReviewInput, PharmacyIdParams>
): Promise<void> {
  const { body, params } = res.locals.validated;

  const data = await createPharmacyReviewService(params.pharmacyId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function moderatePharmacyReview(
  req: Request,
  res: ValidatedResponse<ModeratePharmacyReviewInput, PharmacyReviewParams>
): Promise<void> {
  const { body, params } = res.locals.validated;

  const data = await moderatePharmacyReviewService(
    params.pharmacyId,
    params.reviewId,

    {
      status: body.status,
      reason: body.reason,
      moderatorId: req.user?.id ?? '',
    }
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function setFavoritePharmacy(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;

  const data = await setFavoritePharmacyService(
    pharmacyId,
    req.user?.id ?? '',
    req.method === 'PUT'
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
