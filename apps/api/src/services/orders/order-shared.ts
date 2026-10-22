import { Types } from 'mongoose';

import { Product } from '../../models/product.model';
import { ProductOffer } from '../../models/productOffer.model';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from '../catalog/product-category.service';

import type {
  OrderClientSnapshot,
  OrderEntity,
  OrderItemEntity,
  OrderResponseDto,
} from '../../types/order';

import type { ProductEntity, ProductOfferEntity } from '../../types/product';

import type {
  ProductCategoryReferenceDto,
  ProductCategorySnapshotDto,
} from '../../types/product-category';

import type {
  PharmacyEntity,
  PharmacyLocationDraft,
} from '../../types/pharmacy';

import { hasCompleteBankDetails } from '../pharmacies/bank-details';

//===============================================================

export type CartItemDocument = {
  _id: Types.ObjectId;
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  expiresAt: Date;
};

//===============================================================

export type CartDocument = {
  _id: Types.ObjectId;
  clientUserId: Types.ObjectId;
  items: CartItemDocument[];
  revision: number;
  updatedAt: Date;
};

//===============================================================

export type ProductDocument = ProductEntity & { _id: Types.ObjectId };
export type ProductOfferDocument = ProductOfferEntity & { _id: Types.ObjectId };
export type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
export type OrderDocument = OrderEntity & { _id: Types.ObjectId };

//===============================================================

export type UserDocument = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  pictureUrl?: string;
  phone?: string;
  address?: string;
  isDefaultPharmacyClient?: boolean;
  defaultClientPharmacyId?: Types.ObjectId;
  status?: string;
  role?: string;
};

//===============================================================

type ProductFallbackMap = Map<
  string,
  Readonly<{
    category?: ProductCategoryReferenceDto;
    rating?: number;
    reviewsCount?: number;
  }>
>;

//===============================================================

type OfferFallbackMap = Map<string, ProductOfferDocument>;

export type ClientUserMap = Map<string, UserDocument>;

//===============================================================

type ManagerCommentDto = {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;

  author: {
    userId: string;
    displayName: string;
  };
};

//===============================================================

function getCategorySnapshot(
  snapshot: OrderItemEntity['productSnapshot']
): ProductCategorySnapshotDto | undefined {
  if (!snapshot.categoryNameSnapshot || !snapshot.categorySlugSnapshot) {
    return undefined;
  }

  return {
    ...(snapshot.categoryId ? { id: String(snapshot.categoryId) } : {}),

    name: snapshot.categoryNameSnapshot,
    slug: snapshot.categorySlugSnapshot,
  };
}

//===============================================================

export function createOrderClientSnapshot(
  client: UserDocument
): OrderClientSnapshot {
  const isDefaultPharmacyClient = Boolean(client.isDefaultPharmacyClient);

  if (isDefaultPharmacyClient) {
    return {
      name: 'Walk-in client',
      isDefaultPharmacyClient: true,

      ...(client.defaultClientPharmacyId
        ? { defaultClientPharmacyId: client.defaultClientPharmacyId }
        : {}),
    };
  }

  return {
    name: client.name?.trim() || client.email?.trim() || 'Client',

    ...(client.email?.trim() ? { email: client.email.trim() } : {}),
    ...(client.phone?.trim() ? { phone: client.phone.trim() } : {}),
    ...(client.address?.trim() ? { address: client.address.trim() } : {}),

    ...(client.pictureUrl?.trim()
      ? { pictureUrl: client.pictureUrl.trim() }
      : {}),

    isDefaultPharmacyClient: false,
  };
}

//===============================================================

export function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

//===============================================================

export function createOrderNumber(orderId: Types.ObjectId): string {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('');

  const timePart = [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join('');

  return `EP-${datePart}-${timePart}-${orderId.toString().slice(-8).toUpperCase()}`;
}

//===============================================================

function createOrderPharmacyLocationSnapshot(
  location: PharmacyEntity['location']
): PharmacyLocationDraft | undefined {
  if (!location) return undefined;

  const snapshot: PharmacyLocationDraft = {
    ...(location.address ? { address: location.address } : {}),
    ...(location.settlement ? { settlement: location.settlement } : {}),
    ...(location.region ? { region: location.region } : {}),
    ...(location.countryCode ? { countryCode: location.countryCode } : {}),
  };

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

//===============================================================

export function createOrderPharmacySnapshot(
  pharmacy: PharmacyDocument
): OrderEntity['pharmacySnapshot'] {
  const location = createOrderPharmacyLocationSnapshot(pharmacy.location);

  return {
    name: pharmacy.name,

    ...(location ? { location } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(typeof pharmacy.rating === 'number' ? { rating: pharmacy.rating } : {}),

    ...(typeof pharmacy.reviewsCount === 'number'
      ? { reviewsCount: pharmacy.reviewsCount }
      : {}),

    ...(hasCompleteBankDetails(pharmacy.bankDetails)
      ? { bankDetails: pharmacy.bankDetails }
      : {}),
  };
}

//===============================================================

function getOrderPharmacyLocation(
  pharmacySnapshot: OrderEntity['pharmacySnapshot']
): PharmacyLocationDraft | undefined {
  const canonical = createOrderPharmacyLocationSnapshot(
    pharmacySnapshot.location
  );

  if (canonical) return canonical;

  const address = pharmacySnapshot.address?.trim();
  const settlement = pharmacySnapshot.city?.trim();

  if (!address && !settlement) return undefined;

  return {
    ...(address ? { address } : {}),
    ...(settlement ? { settlement } : {}),
  };
}

//===============================================================

export function serializeManagerComments(
  order: OrderDocument
): ManagerCommentDto[] {
  const comments = (order.managerComments ?? []).map((comment) => ({
    id: comment._id?.toString() ?? '',
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    createdBy: comment.createdBy.toString(),

    author: {
      userId: comment.createdBy.toString(),
      displayName: comment.authorDisplayName?.trim() || 'Pharmacy member',
    },
  }));

  if (order.managerComment?.trim()) {
    const legacyAuthorId =
      order.statusHistory.at(-1)?.changedBy.toString() ??
      order.userId.toString();

    comments.push({
      id: order._id.toString(),
      text: order.managerComment.trim(),
      createdAt: order.updatedAt.toISOString(),
      createdBy: legacyAuthorId,

      author: {
        userId: legacyAuthorId,
        displayName: 'Pharmacy member',
      },
    });
  }

  return comments
    .filter((comment) => Boolean(comment.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

//===============================================================

export function serializeOrder(
  order: OrderDocument,
  productFallbacks?: ProductFallbackMap,
  clientUsers?: ClientUserMap,
  offerFallbacks?: OfferFallbackMap
): OrderResponseDto {
  const clientUser = clientUsers?.get(order.userId.toString());
  const clientSnapshot = order.clientSnapshot;
  const clientIdentity = clientSnapshot ?? clientUser;

  const isDefaultPharmacyClient = Boolean(
    clientIdentity?.isDefaultPharmacyClient
  );

  const hasClientIdentity = Boolean(clientIdentity);

  const clientName = isDefaultPharmacyClient
    ? 'Walk-in client'
    : (clientIdentity?.name ?? clientIdentity?.email);

  const clientPhotoUrl = isDefaultPharmacyClient
    ? order.pharmacySnapshot.imageUrl
    : clientIdentity?.pictureUrl;

  const clientPhone = isDefaultPharmacyClient
    ? undefined
    : clientIdentity?.phone;

  const clientAddress = isDefaultPharmacyClient
    ? undefined
    : clientIdentity?.address;

  const managerComments = serializeManagerComments(order);
  const pharmacyLocation = getOrderPharmacyLocation(order.pharmacySnapshot);

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    userId: order.userId.toString(),
    clientId: order.userId.toString(),

    ...(clientName ? { clientName } : {}),
    ...(clientPhotoUrl ? { clientPhotoUrl } : {}),
    ...(clientPhone ? { clientPhone } : {}),
    ...(clientAddress ? { clientAddress } : {}),

    ...(hasClientIdentity
      ? {
          client: {
            id: order.userId.toString(),
            name: clientName ?? 'Client',

            ...(clientPhotoUrl ? { photoUrl: clientPhotoUrl } : {}),
          },
        }
      : {}),

    pharmacyId: order.pharmacyId.toString(),
    pharmacyName: order.pharmacySnapshot.name,

    ...(order.pharmacySnapshot.imageUrl
      ? { pharmacyImageUrl: order.pharmacySnapshot.imageUrl }
      : {}),

    ...(typeof order.pharmacySnapshot.rating === 'number'
      ? { pharmacyRating: order.pharmacySnapshot.rating }
      : {}),

    ...(typeof order.pharmacySnapshot.reviewsCount === 'number'
      ? { pharmacyReviewsCount: order.pharmacySnapshot.reviewsCount }
      : {}),

    ...(order.pharmacySnapshot.phone
      ? { pharmacyPhone: order.pharmacySnapshot.phone }
      : {}),

    ...(order.pharmacySnapshot.email
      ? { pharmacyEmail: order.pharmacySnapshot.email }
      : {}),

    ...(pharmacyLocation ? { pharmacyLocation } : {}),

    ...(order.pharmacySnapshot.workingHours
      ? { pharmacyWorkingHours: order.pharmacySnapshot.workingHours }
      : {}),

    totalItems: order.totalItems,
    totalPrice: order.totalPrice,
    currency: order.currency,
    status: order.status,
    createdByType: order.createdByType ?? 'client',

    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt.toISOString(),
      changedBy: entry.changedBy.toString(),

      ...(entry.comment ? { comment: entry.comment } : {}),
    })),

    activityHistory: (order.activityHistory ?? []).map((entry) => ({
      type: entry.type,
      occurredAt: entry.occurredAt.toISOString(),
      changedBy: entry.changedBy.toString(),
      productId: entry.productId.toString(),
      productOfferId: entry.productOfferId.toString(),
      productName: entry.productName,
      previousQuantity: entry.previousQuantity,
      quantity: entry.quantity,
      quantityDelta: entry.quantityDelta,
      previousUnitPrice: entry.previousUnitPrice,
      unitPrice: entry.unitPrice,
    })),

    ...(order.rejectionReason
      ? { rejectionReason: order.rejectionReason }
      : {}),

    ...(order.rejectedAt ? { rejectedAt: order.rejectedAt.toISOString() } : {}),
    ...(order.rejectedBy ? { rejectedBy: order.rejectedBy.toString() } : {}),

    paymentMethod: order.paymentMethod,
    delivery: order.delivery,

    ...(order.comment ? { comment: order.comment } : {}),
    ...(order.managerComment ? { managerComment: order.managerComment } : {}),

    managerCommentsCount: managerComments.length,

    ...(managerComments.length ? { managerComments } : {}),

    ...(hasCompleteBankDetails(order.pharmacySnapshot.bankDetails)
      ? { bankDetails: order.pharmacySnapshot.bankDetails }
      : {}),

    items: order.items.map((item) => {
      const productFallback = productFallbacks?.get(item.productId.toString());
      const offerFallback = offerFallbacks?.get(item.productOfferId.toString());

      const category =
        getCategorySnapshot(item.productSnapshot) ?? productFallback?.category;

      const rating =
        typeof item.productSnapshot.rating === 'number'
          ? item.productSnapshot.rating
          : productFallback?.rating;

      const reviewsCount =
        typeof item.productSnapshot.reviewsCount === 'number'
          ? item.productSnapshot.reviewsCount
          : productFallback?.reviewsCount;

      return {
        id: item._id?.toString() ?? '',
        productId: item.productId.toString(),
        productOfferId: item.productOfferId.toString(),
        name: item.productSnapshot.name,

        ...(item.productSnapshot.slug
          ? { slug: item.productSnapshot.slug }
          : {}),

        article: item.productSnapshot.article,

        ...(category ? { category } : {}),

        ...(item.productSnapshot.imageUrl
          ? { imageUrl: item.productSnapshot.imageUrl }
          : {}),

        ...(item.productSnapshot.manufacturer
          ? { manufacturer: item.productSnapshot.manufacturer }
          : {}),

        ...(item.productSnapshot.dosage
          ? { dosage: item.productSnapshot.dosage }
          : {}),

        ...(item.productSnapshot.packageQuantity
          ? { packageQuantity: item.productSnapshot.packageQuantity }
          : {}),

        ...(typeof rating === 'number' ? { rating } : {}),
        ...(typeof reviewsCount === 'number' ? { reviewsCount } : {}),

        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,

        ...(typeof offerFallback?.availableQuantity === 'number'
          ? { availableQuantity: offerFallback.availableQuantity }
          : {}),

        ...(typeof offerFallback?.price === 'number'
          ? { currentPrice: offerFallback.price }
          : {}),
      };
    }),
  };
}

//===============================================================

export async function getOrderProductFallbacks(
  order: OrderDocument
): Promise<ProductFallbackMap> {
  const missingProductDetailsIds = order.items
    .filter(
      (item) =>
        !item.productSnapshot.categoryNameSnapshot ||
        !item.productSnapshot.categorySlugSnapshot ||
        typeof item.productSnapshot.rating !== 'number' ||
        typeof item.productSnapshot.reviewsCount !== 'number'
    )

    .map((item) => item.productId);

  if (!missingProductDetailsIds.length) return new Map();

  const products = await Product.find({
    _id: { $in: missingProductDetailsIds },
  })
    .select('categoryId rating reviewsCount')
    .lean<ProductDocument[]>();

  const categoryMap = await getProductCategoryReferenceMap(
    products.map((product) => product.categoryId)
  );

  return new Map(
    products.map((product) => [
      String(product._id),
      {
        category: getProductCategoryReferenceOrThrow(
          categoryMap,
          product.categoryId
        ),

        rating: product.rating,
        reviewsCount: product.reviewsCount,
      },
    ])
  );
}

//===============================================================

export async function getOrderOfferFallbacks(
  order: OrderDocument
): Promise<OfferFallbackMap> {
  if (!order.items.length) return new Map();

  const offers = await ProductOffer.find({
    _id: { $in: order.items.map((item) => item.productOfferId) },
  })
    .select('_id price availableQuantity reservedQuantity totalQuantity')
    .lean<ProductOfferDocument[]>();

  return new Map(offers.map((offer) => [String(offer._id), offer]));
}

//===============================================================

export function createOrderItemFromProductOffer({
  offer,
  product,
  category,
  quantity,
  previousItem,
}: {
  offer: ProductOfferDocument;
  product: ProductDocument;
  category: ProductCategoryReferenceDto;
  quantity: number;
  previousItem?: OrderItemEntity;
}): OrderItemEntity {
  return {
    ...(previousItem?._id ? { _id: previousItem._id } : {}),

    productId: offer.productId,
    productOfferId: offer._id,

    productSnapshot: {
      name: product.name,

      ...(product.slug ? { slug: product.slug } : {}),

      article: product.article,
      categoryId: product.categoryId,
      categoryNameSnapshot: category.name,
      categorySlugSnapshot: category.slug,

      ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
      ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
      ...(product.dosage ? { dosage: product.dosage } : {}),

      ...(product.packageQuantity
        ? { packageQuantity: product.packageQuantity }
        : {}),

      ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),

      ...(typeof product.reviewsCount === 'number'
        ? { reviewsCount: product.reviewsCount }
        : {}),
    },

    quantity,

    unitPrice:
      previousItem && quantity <= previousItem.quantity
        ? previousItem.unitPrice
        : offer.price,

    totalPrice:
      quantity *
      (previousItem && quantity <= previousItem.quantity
        ? previousItem.unitPrice
        : offer.price),
  };
}
