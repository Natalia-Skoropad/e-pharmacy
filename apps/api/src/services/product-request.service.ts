import { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { ProductRequest } from '../models/productRequest.model';

import type { ProductRequestEntity, ProductRequestResponseDto } from '../types/product-request';
import type { ProductRequestsQuery } from '../schemas/product-request.schema';

import { createFlexibleSearchRegExp, createSafeRegExp } from '../utils/regexp';

//===============================================================

type ProductRequestDocument = ProductRequestEntity & { _id: Types.ObjectId };

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

function serializeProductRequest(
  request: ProductRequestDocument
): ProductRequestResponseDto {
  return {
    id: String(request._id),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    requestNumber: String(request._id),
    productId: request.productId ? String(request.productId) : undefined,
    productArticle: request.article,
    productName: request.name,
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

  const [requests, total] = await Promise.all([
    ProductRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean<ProductRequestDocument[]>(),
    ProductRequest.countDocuments(filter),
  ]);

  return {
    items: requests.map(serializeProductRequest),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}
