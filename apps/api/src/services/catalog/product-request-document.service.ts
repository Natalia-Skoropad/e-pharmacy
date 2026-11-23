import { Types, type ClientSession } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ATTACHMENT_RULES } from '../../constants/catalog/product-request-validation';

import { ProductRequestDocumentFile } from '../../models/catalog/productRequestDocumentFile.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import type { ProductRequestFile } from '../../types/catalog/product-request';

import { decodeAndVerifyDocumentUpload } from '../../utils/documents/documentUpload';
import { httpError } from '../../utils/http/httpError';

import { getProductRequestOwnerScope } from './product-request-access';

//===================================================================

const PRIVATE_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

//===================================================================

function metadata(document: {
  _id: Types.ObjectId;
  name: string;
  size: number;
  type: string;
}): ProductRequestFile {
  return {
    documentId: String(document._id),
    name: document.name,
    size: document.size,
    type: document.type,
  };
}

//===================================================================

/** The same strict MIME, signature, size and extension checks as pharmacy documents. */
export async function uploadProductRequestDocumentService(
  userId: string,
  input: { name: string; type: string; size: number; dataUrl: string }
): Promise<{ document: ProductRequestFile }> {
  const { ownerId } = await getProductRequestOwnerScope(userId);

  const verified = decodeAndVerifyDocumentUpload(
    input,
    PRODUCT_REQUEST_ATTACHMENT_RULES
  );

  const document = await ProductRequestDocumentFile.create({
    name: input.name,
    ...verified,
    ownerId,
    uploadedByUserId: ownerId,
    expiresAt: new Date(Date.now() + PRIVATE_UPLOAD_TTL_MS),
  });

  return { document: metadata(document) };
}

//===================================================================

/** Resolve only owner-scoped files and attach them atomically with the request. */
export async function resolveProductRequestDocuments(
  ownerId: Types.ObjectId,
  requestId: Types.ObjectId,
  selections: readonly ProductRequestFile[],
  session: ClientSession
): Promise<ProductRequestFile[]> {
  const result: ProductRequestFile[] = [];
  const now = new Date();
  const seen = new Set<string>();

  if (
    selections.length > PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles ||
    selections.reduce((sum, file) => sum + file.size, 0) >
      PRODUCT_REQUEST_ATTACHMENT_RULES.maxTotalSizeBytes
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Product request document quota exceeded.'
    );
  }

  for (const file of selections) {
    if (file.documentId) {
      if (seen.has(file.documentId))
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Duplicate product request document.'
        );
      seen.add(file.documentId);

      // Claim an unclaimed upload, or retain a file already on this request.
      const attached = await ProductRequestDocumentFile.findOneAndUpdate(
        {
          _id: file.documentId,
          ownerId,
          name: file.name,
          size: file.size,
          type: file.type,

          $or: [
            { requestId, attachedAt: { $exists: true } },
            { requestId: { $exists: false }, expiresAt: { $gt: now } },
          ],
        },

        { $set: { requestId, attachedAt: now }, $unset: { expiresAt: '' } },
        { new: true, session }
      );

      if (!attached) {
        // Cloning a rejected request owned by the same owner must COPY the
        // binary, never rebind the original request's document reference.
        const original = await ProductRequestDocumentFile.findOne({
          _id: file.documentId,
          ownerId,
          attachedAt: { $exists: true },
          name: file.name,
          size: file.size,
          type: file.type,
        })
          .select('+content')
          .session(session);

        if (
          !original?.content ||
          !original.requestId ||
          String(original.requestId) === String(requestId)
        ) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'An attached document is missing, expired or belongs to another request.'
          );
        }

        const sourceRequest = await ProductRequest.findOne({
          _id: original.requestId,
          status: 'rejected',
        })
          .select('_id additionalFiles')
          .session(session);

        if (
          !sourceRequest?.additionalFiles?.some(
            (entry: ProductRequestFile) => entry.documentId === file.documentId
          )
        ) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'The source request no longer references this document.'
          );
        }

        const [copy] = await ProductRequestDocumentFile.create(
          [
            {
              ownerId,
              uploadedByUserId: ownerId,
              name: original.name,
              size: original.size,
              type: original.type,
              content: Buffer.from(original.content),
              sha256: original.sha256,
              requestId,
              attachedAt: now,
            },
          ],
          { session }
        );

        result.push(metadata(copy));
        continue;
      }

      result.push(metadata(attached));
      continue;
    }

    // Backward compatibility only: older drafts still carry an inline dataUrl.
    if (!file.dataUrl)
      throw httpError(HTTP_STATUS.BAD_REQUEST, 'Document content is missing.');

    const verified = decodeAndVerifyDocumentUpload(
      {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: file.dataUrl,
      },

      PRODUCT_REQUEST_ATTACHMENT_RULES
    );

    const [created] = await ProductRequestDocumentFile.create(
      [
        {
          name: file.name,
          ...verified,
          ownerId,
          uploadedByUserId: ownerId,
          requestId,
          attachedAt: now,
        },
      ],
      { session }
    );

    result.push(metadata(created));
  }

  return result;
}

//===================================================================

/** Remove binaries no longer referenced by this saved request (not pending uploads). */
export async function reconcileProductRequestDocuments(
  ownerId: Types.ObjectId,
  requestId: Types.ObjectId,
  selected: readonly ProductRequestFile[],
  session: ClientSession
): Promise<void> {
  const ids = selected.flatMap((file) =>
    file.documentId ? [new Types.ObjectId(file.documentId)] : []
  );

  await ProductRequestDocumentFile.deleteMany({
    ownerId,
    requestId,
    attachedAt: { $exists: true },

    ...(ids.length ? { _id: { $nin: ids } } : {}),
  }).session(session);
}

//===================================================================

export async function downloadProductRequestDocumentService(
  userId: string,
  requestId: string,
  documentId: string
): Promise<{ document: ProductRequestFile; content: Buffer }> {
  if (
    !Types.ObjectId.isValid(requestId) ||
    !Types.ObjectId.isValid(documentId)
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );
  }

  const scope = await getProductRequestOwnerScope(userId);

  const request = await ProductRequest.findOne({
    _id: requestId,
    ...scope.filter,
  })
    .select('additionalFiles')
    .lean<{ additionalFiles?: ProductRequestFile[] } | null>();

  if (
    !request?.additionalFiles?.some((file) => file.documentId === documentId)
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );
  }

  const file = await ProductRequestDocumentFile.findOne({
    _id: documentId,
    ownerId: scope.ownerId,
    requestId,
    attachedAt: { $exists: true },
  }).select('+content');

  if (!file?.content)
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );

  return { document: metadata(file), content: Buffer.from(file.content) };
}

//===================================================================

/** Admin must have the product-requests view permission at the route level. */
export async function downloadProductRequestDocumentByAdminService(
  requestId: string,
  documentId: string
): Promise<{ document: ProductRequestFile; content: Buffer }> {
  if (
    !Types.ObjectId.isValid(requestId) ||
    !Types.ObjectId.isValid(documentId)
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );
  }

  const request = await ProductRequest.findById(requestId)
    .select('additionalFiles')
    .lean<{ additionalFiles?: ProductRequestFile[] } | null>();

  if (
    !request?.additionalFiles?.some((file) => file.documentId === documentId)
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );
  }

  const file = await ProductRequestDocumentFile.findOne({
    _id: documentId,
    requestId,
    attachedAt: { $exists: true },
  }).select('+content');

  if (!file?.content)
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request document was not found.'
    );

  return { document: metadata(file), content: Buffer.from(file.content) };
}
