import { Types } from 'mongoose';

import type {
  ProductRequestEntity,
  ProductRequestHistoryEntry,
  ProductRequestResponseDto,
  ProductRequestStatus,
} from '../../types/catalog/product-request';

import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

//===============================================================

export type ProductRequestProductDocument = {
  _id: Types.ObjectId;
  categoryId?: Types.ObjectId;
  imageUrl?: string;
  article?: string;
  name?: string;
};

//===============================================================

export type ProductRequestHistoryDocument = ProductRequestHistoryEntry & {
  _id?: Types.ObjectId;
};

//===============================================================

export type ProductRequestDocument = Omit<
  ProductRequestEntity,
  'productId' | 'history'
> & {
  _id: Types.ObjectId;
  productId?: Types.ObjectId | ProductRequestProductDocument;
  history?: ProductRequestHistoryDocument[];
};

//===============================================================

function isProductRequestProductDocument(
  value: unknown
): value is ProductRequestProductDocument {
  return Boolean(
    value &&
    typeof value === 'object' &&
    '_id' in value &&
    !(value instanceof Types.ObjectId)
  );
}

//===============================================================

function getProductRequestProductId(
  product: ProductRequestDocument['productId']
): string | undefined {
  if (!product) return undefined;

  return product instanceof Types.ObjectId
    ? String(product)
    : String(product._id);
}

//===============================================================

export function getStatusHistoryCopy(
  status: ProductRequestStatus,
  rejectionReason?: string
): Pick<ProductRequestHistoryEntry, 'title' | 'description'> {
  switch (status) {
    case 'draft':
      return {
        title: 'Draft created',
        description: 'The pharmacy saved the product request as a draft.',
      };

    case 'new':
      return {
        title: 'Sent for moderation',
        description: 'The pharmacy sent the product request to Admin.',
      };

    case 'in_progress':
      return {
        title: 'Review started',
        description: 'Admin started reviewing the submitted product data.',
      };

    case 'approved':
      return {
        title: 'Request approved',

        description:
          'Admin approved the request and created or linked the product.',
      };

    case 'rejected':
      return {
        title: 'Request rejected',

        description:
          rejectionReason ||
          'Admin rejected the request because the submitted information needs correction.',
      };
  }
}

//===============================================================

function getFallbackHistory(
  request: ProductRequestDocument
): ProductRequestHistoryDocument[] {
  const statusSequence: ProductRequestStatus[] = ['draft'];

  if (request.status !== 'draft') statusSequence.push('new');

  if (
    request.status === 'in_progress' ||
    request.status === 'approved' ||
    request.status === 'rejected'
  ) {
    statusSequence.push('in_progress');
  }

  if (request.status === 'approved') statusSequence.push('approved');
  if (request.status === 'rejected') statusSequence.push('rejected');

  const start = request.createdAt.getTime();
  const end = request.updatedAt.getTime();

  const step =
    statusSequence.length > 1
      ? Math.max(1, (end - start) / (statusSequence.length - 1))
      : 0;

  return statusSequence.map((status, index) => {
    const copy = getStatusHistoryCopy(status, request.rejectionReason);

    return {
      status,
      ...copy,
      createdAt: new Date(start + step * index),
    };
  });
}

//===============================================================

export function serializeProductRequest(
  request: ProductRequestDocument,
  commentsTotal = 0,
  category?: ProductCategoryReferenceDto
): ProductRequestResponseDto {
  const hasPersistedHistory = Boolean(request.history?.length);

  const history = hasPersistedHistory
    ? (request.history ?? [])
    : getFallbackHistory(request);

  return {
    id: String(request._id),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    requestNumber: String(request._id),
    productId: getProductRequestProductId(request.productId),

    productImageUrl: isProductRequestProductDocument(request.productId)
      ? request.productId.imageUrl || request.productImage?.dataUrl
      : request.productImage?.dataUrl,

    productArticle: isProductRequestProductDocument(request.productId)
      ? request.productId.article || request.article
      : request.article,

    productName: isProductRequestProductDocument(request.productId)
      ? request.productId.name || request.name
      : request.name,

    article: request.article,
    name: request.name,
    categoryMode: request.categoryMode,

    ...(category ? { category } : {}),

    ...(request.customCategory
      ? { customCategory: request.customCategory }
      : {}),

    status: request.status,
    productImage: request.productImage,
    manufacturer: request.manufacturer,
    countryOfOrigin: request.countryOfOrigin,
    dosage: request.dosage,
    packageSize: request.packageSize,
    form: request.form,

    activeSubstance: request.activeSubstance,
    prescriptionType: request.prescriptionType,
    fullDescription: request.fullDescription,
    pharmacyComment: request.pharmacyComment,
    additionalFiles: request.additionalFiles,
    rejectionReason: request.rejectionReason,

    history: history.map((entry, index) => ({
      id: entry._id ? String(entry._id) : `${request._id}-${index}`,
      status: entry.status,
      title: entry.title,
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
      isInferred: !hasPersistedHistory,
    })),

    commentsTotal,
  };
}
