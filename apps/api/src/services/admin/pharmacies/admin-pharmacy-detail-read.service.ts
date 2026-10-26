import { Types } from 'mongoose';

import { USER_ROLES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { Order } from '../../../models/orders/order.model';
import { ProductRequest } from '../../../models/catalog/productRequest.model';
import { PharmacyAdminComment } from '../../../models/admin/comments/pharmacyAdminComment.model';
import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { User } from '../../../models/accounts/user.model';

import { buildPharmacyAuditScopeFilter } from '../audit/admin-audit-filters';

import type {
  EditablePharmacyBankDetails,
  PharmacyEntity,
  PharmacyLocationDraft,
} from '../../../types/pharmacies/pharmacy';

import { httpError } from '../../../utils/http/httpError';
import { buildPagedPharmacyItemsPipeline } from '../../pharmacies/registry/pharmacy-registry-query';
import { getOrderSalesStatisticsForPharmacyService } from '../../orders/order-sales-statistics.service';
import { hasCompleteBankDetails } from '../../pharmacies/bank-details';

import type { OrderSalesStatisticsQuery } from '../../../schemas/orders/order.schema';

//===============================================================

type DetailDocument = PharmacyEntity & { _id: Types.ObjectId };

//===================================================================

type OwnerDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
  status: 'new' | 'active' | 'blocked';
};

type PharmacyMetricsRow = {
  activeClientsCount: number;
  addedProductsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
};

//===============================================================

const BANK_FIELDS = [
  'recipientName',
  'taxId',
  'iban',
  'bankName',
  'receiptEmail',
  'paymentPurpose',
] as const;

//===============================================================

function timestamp(value: Date, label: string): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value.toISOString();
}

//===============================================================

function objectId(value: Types.ObjectId, label: string): string {
  const id = String(value);

  if (!/^[0-9a-f]{24}$/i.test(id)) throw new TypeError(`Invalid ${label}.`);

  return id;
}

//===============================================================

function serializeLocation(
  value?: PharmacyLocationDraft
): PharmacyLocationDraft | undefined {
  if (!value) return undefined;

  return {
    ...(value.address !== undefined ? { address: value.address } : {}),
    ...(value.settlement !== undefined ? { settlement: value.settlement } : {}),
    ...(value.region !== undefined ? { region: value.region } : {}),

    ...(value.countryCode !== undefined
      ? { countryCode: value.countryCode }
      : {}),

    ...(value.geo !== undefined
      ? {
          geo: {
            type: value.geo.type,
            coordinates: [...value.geo.coordinates] as [number, number],
          },
        }
      : {}),
  };
}

//===============================================================

function serializeBankDetails(
  value?: EditablePharmacyBankDetails | null
): EditablePharmacyBankDetails | undefined {
  if (!value) return undefined;

  return Object.fromEntries(
    BANK_FIELDS.filter((key) => value[key] !== undefined).map((key) => [
      key,
      value[key],
    ])
  ) as EditablePharmacyBankDetails;
}

//===============================================================

function publishedData(pharmacy: DetailDocument) {
  const bankDetails = serializeBankDetails(pharmacy.bankDetails);

  return {
    name: pharmacy.name, // An onboarding pharmacy may have an empty name.

    ...(pharmacy.location
      ? { location: serializeLocation(pharmacy.location) }
      : {}),

    ...(pharmacy.email !== undefined ? { email: pharmacy.email } : {}),
    ...(pharmacy.phone !== undefined ? { phone: pharmacy.phone } : {}),

    ...(pharmacy.workingHours !== undefined
      ? { workingHours: pharmacy.workingHours }
      : {}),

    ...(pharmacy.imageUrl !== undefined ? { imageUrl: pharmacy.imageUrl } : {}),

    ...(pharmacy.description !== undefined
      ? { description: pharmacy.description }
      : {}),

    ...(pharmacy.shortDescription !== undefined
      ? { shortDescription: pharmacy.shortDescription }
      : {}),

    ...(pharmacy.license !== undefined ? { license: pharmacy.license } : {}),
    ...(bankDetails ? { bankDetails } : {}),

    bankTransferAvailable: hasCompleteBankDetails(bankDetails),
  };
}

//===============================================================

function submittedChanges(pending?: PharmacyEntity['pendingModeration']) {
  if (!pending) return undefined;

  const bankDetails = pending.bankDetails;

  // The pending payload is stored as Mixed. Never spread it into a response:
  // allowlist only the established domain fields and never expose fingerprints.
  const pendingBankDetails = bankDetails
    ? Object.fromEntries(
        BANK_FIELDS.filter((key) => bankDetails[key] !== undefined).map(
          (key) => [key, bankDetails[key]]
        )
      )
    : undefined;

  return {
    ...(pending.name !== undefined ? { name: pending.name } : {}),

    ...(pending.location !== undefined
      ? { location: serializeLocation(pending.location) }
      : {}),

    ...(pending.phone !== undefined ? { phone: pending.phone } : {}),
    ...(pending.email !== undefined ? { email: pending.email } : {}),

    ...(pending.workingHours !== undefined
      ? { workingHours: pending.workingHours }
      : {}),

    ...(pending.imageUrl !== undefined ? { imageUrl: pending.imageUrl } : {}),

    ...(pending.description !== undefined
      ? { description: pending.description }
      : {}),

    ...(pending.shortDescription !== undefined
      ? { shortDescription: pending.shortDescription }
      : {}),

    ...(pendingBankDetails !== undefined
      ? { bankDetails: pendingBankDetails }
      : {}),

    ...(pending.documents !== undefined
      ? { documentsCount: pending.documents.length }
      : {}),
  };
}

//===============================================================

/** A private, read-only Admin endpoint; authorization is enforced in the router. */
export async function getAdminPharmacyDetailService(pharmacyId: string) {
  // Defense in depth: the router also validates this path segment.
  if (!/^[0-9a-f]{24}$/i.test(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid pharmacy ID.');
  }

  const _id = new Types.ObjectId(pharmacyId);

  const pharmacy = await Pharmacy.findById(_id)
    .select(
      'name location phone email workingHours bankDetails imageUrl description shortDescription license status statusReason reviewState reviewFeedback reviewedAt reviewedBy pendingModeration documents ownerId createdAt updatedAt approvedAt activatedAt'
    )
    .lean<DetailDocument | null>();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  // No N+1: owner and metrics are independent bounded lookups, metrics reuse
  // EXACTLY the Stage 13 owner / Stage 14.4 registry KPI aggregation.
  const [
    owner,
    metricRows,
    commentsCount,
    ordersCount,
    productRequestsCount,
    activityCount,
  ] = await Promise.all([
    User.findOne({ _id: pharmacy.ownerId, role: USER_ROLES.PHARMACY })
      .select('_id name email phone pictureUrl status')
      .lean<OwnerDocument | null>(),

    Pharmacy.aggregate<PharmacyMetricsRow>([
      { $match: { _id } },
      ...buildPagedPharmacyItemsPipeline(0, 1),
    ]),

    PharmacyAdminComment.countDocuments({ pharmacyId: _id }),
    Order.countDocuments({ pharmacyId: _id }),
    ProductRequest.countDocuments({ pharmacyId: _id }),
    AdminAuditLog.countDocuments(buildPharmacyAuditScopeFilter(pharmacyId)),
  ]);

  const metrics = metricRows[0];

  if (!metrics) {
    // Pharmacy disappeared after the initial read.
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  return {
    id: objectId(pharmacy._id, 'pharmacy ID'),
    status: pharmacy.status,

    owner: owner
      ? {
          id: objectId(owner._id, 'owner ID'),
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          status: owner.status,
          ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),
        }
      : null,

    current: publishedData(pharmacy),

    ...(pharmacy.pendingModeration
      ? { pendingChanges: submittedChanges(pharmacy.pendingModeration) }
      : {}),

    ...(pharmacy.statusReason ? { statusReason: pharmacy.statusReason } : {}),
    ...(pharmacy.reviewState ? { reviewState: pharmacy.reviewState } : {}),

    ...(pharmacy.reviewFeedback
      ? { reviewFeedback: pharmacy.reviewFeedback }
      : {}),

    ...(pharmacy.reviewedAt
      ? { reviewedAt: timestamp(pharmacy.reviewedAt, 'reviewedAt') }
      : {}),

    ...(pharmacy.reviewedBy
      ? { reviewedBy: objectId(pharmacy.reviewedBy, 'reviewedBy') }
      : {}),

    dates: {
      createdAt: timestamp(pharmacy.createdAt, 'createdAt'),
      updatedAt: timestamp(pharmacy.updatedAt, 'updatedAt'),

      ...(pharmacy.approvedAt
        ? { approvedAt: timestamp(pharmacy.approvedAt, 'approvedAt') }
        : {}),

      ...(pharmacy.activatedAt
        ? { activatedAt: timestamp(pharmacy.activatedAt, 'activatedAt') }
        : {}),
    },

    documentCount: pharmacy.documents?.length ?? 0,

    tabCounts: {
      comments: commentsCount,
      orders: ordersCount,
      productRequests: productRequestsCount,
      activity: activityCount,
    },

    metrics: {
      activeClientsCount: metrics.activeClientsCount,
      successfulOrdersCount: metrics.successfulOrdersCount,
      successfulRevenue: metrics.successfulRevenue,
      addedProductsCount: metrics.addedProductsCount,
      rating: metrics.rating,
      reviewsCount: metrics.reviewsCount,
    },
  };
}

//===============================================================

/** Admin read scope is guarded by pharmacies.view at the HTTP route. */
export async function getAdminPharmacySalesStatisticsService(
  pharmacyId: string,
  query: OrderSalesStatisticsQuery
) {
  if (!/^[0-9a-f]{24}$/i.test(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid pharmacy ID.');
  }

  const exists = await Pharmacy.exists({ _id: new Types.ObjectId(pharmacyId) });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  return getOrderSalesStatisticsForPharmacyService(pharmacyId, query);
}
