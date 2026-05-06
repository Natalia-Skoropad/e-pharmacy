import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { httpError } from '../utils/httpError';

import type {
  ProductCategory,
  ProductResponseDto,
  ProductReviewResponseDto,
} from '../types/product';

//===============================================================

type ProductsQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  category?: ProductCategory;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';
};

//===============================================================

type ProductReviewDocument = {
  _id: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

//===============================================================

type ProductDocument = {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId: Types.ObjectId;
  storeName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReviewDocument[];
  createdAt: Date;
};

//===============================================================

type ProductSortOption = Record<string, 1 | -1>;

//===============================================================

function serializeProduct(product: ProductDocument): ProductResponseDto {
  return {
    id: product._id.toString(),
    name: product.name,
    ...(product.slug ? { slug: product.slug } : {}),
    ...(product.description ? { description: product.description } : {}),
    category: product.category,
    price: product.price,
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.dosage ? { dosage: product.dosage } : {}),
    ...(product.packageQuantity
      ? { packageQuantity: product.packageQuantity }
      : {}),
    storeId: product.storeId.toString(),
    ...(product.storeName ? { storeName: product.storeName } : {}),
    inStock: product.inStock,
    ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),
    ...(typeof product.reviewsCount === 'number'
      ? { reviewsCount: product.reviewsCount }
      : {}),
  };
}

//===============================================================

function serializeReview(
  review: ProductReviewDocument
): ProductReviewResponseDto {
  return {
    id: review._id.toString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

//===============================================================

function getSort(sort?: ProductsQuery['sort']): ProductSortOption {
  switch (sort) {
    case 'price-asc':
      return { price: 1 };
    case 'price-desc':
      return { price: -1 };
    case 'rating-desc':
      return { rating: -1, reviewsCount: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

//===============================================================

export async function getProductsService(query: ProductsQuery) {
  const {
    page,
    perPage,
    keyword,
    category,
    storeId,
    minPrice,
    maxPrice,
    inStock,
    sort,
  } = query;

  const filter: Record<string, unknown> = {};

  if (keyword) {
    filter.$or = [
      { name: new RegExp(keyword, 'i') },
      { description: new RegExp(keyword, 'i') },
      { manufacturer: new RegExp(keyword, 'i') },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (storeId) {
    filter.storeId = storeId;
  }

  if (typeof inStock === 'boolean') {
    filter.inStock = inStock;
  }

  if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
    filter.price = {
      ...(typeof minPrice === 'number' ? { $gte: minPrice } : {}),
      ...(typeof maxPrice === 'number' ? { $lte: maxPrice } : {}),
    };
  }

  const skip = (page - 1) * perPage;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .lean<ProductDocument[]>(),
    Product.countDocuments(filter),
  ]);

  return {
    items: products.map(serializeProduct),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

//===============================================================

export async function getProductDetailsService(productId: string) {
  const product = await Product.findById(
    productId
  ).lean<ProductDocument | null>();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return {
    product: serializeProduct(product),
  };
}

//===============================================================

export async function getProductReviewsService(productId: string) {
  const product = await Product.findById(productId)
    .select('reviews')
    .lean<ProductDocument | null>();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const reviews = product.reviews ?? [];

  return {
    items: reviews.map(serializeReview),
    total: reviews.length,
  };
}
