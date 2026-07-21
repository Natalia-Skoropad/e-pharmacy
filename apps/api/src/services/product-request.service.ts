import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';

import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { ProductRequest } from '../models/productRequest.model';
import '../models/product.model';

import type {
  ProductRequestEntity,
  ProductRequestHistoryEntry,
  ProductRequestResponseDto,
  ProductRequestStatus,
} from '../types/product-request';

import type {
  CreateProductRequestInput,
  ProductRequestsQuery,
  UpdateProductRequestInput,
} from '../schemas/product-request.schema';

import { httpError } from '../utils/httpError';
import { createFlexibleSearchRegExp, createSafeRegExp } from '../utils/regexp';

//===============================================================

type ProductRequestProductDocument = {
  _id: Types.ObjectId;
  imageUrl?: string;
  article?: string;
  name?: string;
};

type ProductRequestHistoryDocument = ProductRequestHistoryEntry & {
  _id?: Types.ObjectId;
};

type ProductRequestDocument = Omit<
  ProductRequestEntity,
  'productId' | 'history'
> & {
  _id: Types.ObjectId;
  productId?: Types.ObjectId | ProductRequestProductDocument;
  history?: ProductRequestHistoryDocument[];
};

type CurrentPharmacy = {
  _id: Types.ObjectId;
  status: string;
};

//===============================================================

function getStartOfDay(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

function getEndOfDay(value: string): Date {
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

async function getCurrentPharmacy(userId: string): Promise<CurrentPharmacy | null> {
  if (!Types.ObjectId.isValid(userId)) return null;

  return Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id status')
    .lean<CurrentPharmacy | null>();
}

//===============================================================

async function getCurrentPharmacyId(userId: string) {
  const pharmacy = await getCurrentPharmacy(userId);
  return pharmacy?._id ?? null;
}

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

function getStatusHistoryCopy(
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
        description: 'Admin approved the request and created or linked the product.',
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
  if (request.status === 'in_progress' || request.status === 'approved' || request.status === 'rejected') {
    statusSequence.push('in_progress');
  }
  if (request.status === 'approved') statusSequence.push('approved');
  if (request.status === 'rejected') statusSequence.push('rejected');

  const start = request.createdAt.getTime();
  const end = request.updatedAt.getTime();
  const step = statusSequence.length > 1 ? Math.max(1, (end - start) / (statusSequence.length - 1)) : 0;

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

function serializeProductRequest(
  request: ProductRequestDocument,
  commentsTotal = 0
): ProductRequestResponseDto {
  const history = request.history?.length
    ? request.history
    : getFallbackHistory(request);

  return {
    id: String(request._id),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    requestNumber: String(request._id),
    productId: getProductRequestProductId(request.productId),
    productImageUrl: isProductRequestProductDocument(request.productId)
      ? request.productId.imageUrl
      : undefined,
    productArticle: isProductRequestProductDocument(request.productId)
      ? request.productId.article || request.article
      : request.article,
    productName: isProductRequestProductDocument(request.productId)
      ? request.productId.name || request.name
      : request.name,
    article: request.article,
    name: request.name,
    category: request.category,
    customCategory: request.customCategory,
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
    })),
    commentsTotal,
  };
}

//===============================================================

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

//===============================================================

function getRequestFormUpdate(input: CreateProductRequestInput | UpdateProductRequestInput) {
  return {
    name: input.name.trim(),
    article: input.article.trim().toUpperCase(),
    category: input.category,
    customCategory:
      input.category === 'other'
        ? normalizeOptionalText(input.customCategory)
        : undefined,
    productImage: input.productImage,
    manufacturer: normalizeOptionalText(input.manufacturer),
    countryOfOrigin: normalizeOptionalText(input.countryOfOrigin),
    dosage: normalizeOptionalText(input.dosage),
    packageSize: normalizeOptionalText(input.packageSize),
    form: normalizeOptionalText(input.form),
    activeSubstance: normalizeOptionalText(input.activeSubstance),
    prescriptionType: normalizeOptionalText(input.prescriptionType),
    fullDescription: normalizeOptionalText(input.fullDescription),
    pharmacyComment: normalizeOptionalText(input.pharmacyComment),
    additionalFiles: input.additionalFiles?.length
      ? input.additionalFiles
      : undefined,
  };
}

//===============================================================

export async function createProductRequestService(
  userId: string,
  input: CreateProductRequestInput
) {
  const pharmacy = await getCurrentPharmacy(userId);

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy profile was not found.');
  }

  const canCreateRequest =
    pharmacy.status === PHARMACY_STATUSES.ACTIVE ||
    pharmacy.status === PHARMACY_STATUSES.ON_MODERATION;

  if (!canCreateRequest) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Product requests are available only for an activated pharmacy.'
    );
  }

  const now = new Date();
  const historyCopy = getStatusHistoryCopy(input.status);
  const request = await ProductRequest.create({
    pharmacyId: pharmacy._id,
    status: input.status,
    ...getRequestFormUpdate(input),
    history: [
      {
        status: input.status,
        ...historyCopy,
        createdAt: now,
      },
    ],
  });

  return {
    request: serializeProductRequest(
      request.toObject() as unknown as ProductRequestDocument
    ),
  };
}

//===============================================================

export async function updateProductRequestService(
  userId: string,
  requestId: string,
  input: UpdateProductRequestInput
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(requestId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    pharmacyId,
  });

  if (!request) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  if (request.status !== 'draft') {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Only draft product requests can be edited.'
    );
  }

  request.set({
    ...getRequestFormUpdate(input),
    status: input.status,
  });

  const historyCopy =
    input.status === 'new'
      ? getStatusHistoryCopy('new')
      : {
          title: 'Draft updated',
          description: 'The pharmacy updated the product request draft.',
        };

  request.history = [
    ...(request.history ?? []),
    {
      status: input.status,
      ...historyCopy,
      createdAt: new Date(),
    },
  ];

  await request.save();

  const commentsTotal = await PharmacyNote.countDocuments({
    pharmacyId,
    entityType: 'product_request',
    entityId: request._id,
  });

  return {
    request: serializeProductRequest(
      request.toObject() as unknown as ProductRequestDocument,
      commentsTotal
    ),
  };
}

//===============================================================

export async function deleteProductRequestService(
  userId: string,
  requestId: string
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(requestId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    pharmacyId,
  }).select('_id status');

  if (!request) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  if (request.status !== 'draft') {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Only draft product requests can be deleted.'
    );
  }

  await Promise.all([
    ProductRequest.deleteOne({ _id: request._id }),
    PharmacyNote.deleteMany({
      pharmacyId,
      entityType: 'product_request',
      entityId: request._id,
    }),
  ]);

  return { message: 'Product request draft deleted successfully.' };
}

//===============================================================

export async function getProductRequestsService(
  userId: string,
  query: ProductRequestsQuery
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: query.page,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    };
  }

  const filter: Record<string, unknown> = { pharmacyId };

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  const requestNumber = query.requestNumber?.trim();
  const productName = query.productName?.trim() || query.name?.trim();
  const productArticle = query.productArticle?.trim() || query.article?.trim();

  if (requestNumber) {
    filter._id = Types.ObjectId.isValid(requestNumber)
      ? new Types.ObjectId(requestNumber)
      : null;
  }

  if (productName) {
    filter.name = createFlexibleSearchRegExp(productName);
  }

  if (productArticle) {
    filter.article = createSafeRegExp(productArticle);
  }

  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.perPage;

  const [requests, total, earliestRequest] = await Promise.all([
    ProductRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .populate('productId', 'imageUrl article name')
      .lean<ProductRequestDocument[]>(),
    ProductRequest.countDocuments(filter),
    ProductRequest.findOne({ pharmacyId })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  return {
    items: requests.map((request) => serializeProductRequest(request)),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
    earliestCreatedAt: earliestRequest
      ? earliestRequest.createdAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getProductRequestByIdService(
  userId: string,
  requestId: string
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(requestId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    pharmacyId,
  })
    .populate('productId', 'imageUrl article name')
    .lean<ProductRequestDocument | null>();

  if (!request) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const commentsTotal = await PharmacyNote.countDocuments({
    pharmacyId,
    entityType: 'product_request',
    entityId: request._id,
  });

  return { request: serializeProductRequest(request, commentsTotal) };
}
