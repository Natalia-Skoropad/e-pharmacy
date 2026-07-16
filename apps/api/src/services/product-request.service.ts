import { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { ProductRequest } from '../models/productRequest.model';
import '../models/product.model';

import type {
  ProductRequestEntity,
  ProductRequestResponseDto,
} from '../types/product-request';

import type { ProductRequestsQuery } from '../schemas/product-request.schema';

import { createFlexibleSearchRegExp, createSafeRegExp } from '../utils/regexp';

//===============================================================

type ProductRequestProductDocument = {
  _id: Types.ObjectId;
  imageUrl?: string;
  article?: string;
  name?: string;
};

type ProductRequestDocument = Omit<ProductRequestEntity, 'productId'> & {
  _id: Types.ObjectId;
  productId?: Types.ObjectId | ProductRequestProductDocument;
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

async function getCurrentPharmacyId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return null;

  const pharmacy = await Pharmacy.findOne({ ownerId: userId })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

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

function serializeProductRequest(
  request: ProductRequestDocument
): ProductRequestResponseDto {
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
    status: request.status,
  };
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
    items: requests.map(serializeProductRequest),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
    earliestCreatedAt: earliestRequest
      ? earliestRequest.createdAt.toISOString().slice(0, 10)
      : null,
  };
}
