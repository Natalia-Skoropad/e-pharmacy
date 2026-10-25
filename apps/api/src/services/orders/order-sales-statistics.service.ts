import { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { Order } from '../../models/orders/order.model';
import { ProductCategory } from '../../models/catalog/productCategory.model';
import { getEndOfDay, getStartOfDay } from '../../utils/date-range';

import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';

import type {
  OrderSalesStatisticsDto,
  OrderSalesStatisticsGroupBy,
} from '../../types/order';

import type { ProductCategoryReferenceDto } from '../../types/product-category';
import type { UserRole } from '../../types/user';

import { padDatePart } from './order-shared';
import { getCurrentPharmacyId } from './order-access';

//===============================================================

type OrderSalesAggregationRow = {
  _id: {
    period: string;
    categoryId: Types.ObjectId | null;
    categoryName: string | null;
    categorySlug: string | null;
  };

  quantity: number;
  amount: number;
};

//===============================================================

function getDefaultSalesDateRange(query: OrderSalesStatisticsQuery) {
  const currentYear = new Date().getUTCFullYear();

  return {
    dateFrom: query.dateFrom ?? `${currentYear}-01-01`,
    dateTo: query.dateTo ?? `${currentYear}-12-31`,
  };
}

//===============================================================

function addSalesPeriod(
  date: Date,
  groupBy: OrderSalesStatisticsGroupBy
): Date {
  const nextDate = new Date(date);

  if (groupBy === 'day') {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate;
  }

  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1, 1);

  return nextDate;
}

//===============================================================

function createSalesPeriodKey(
  date: Date,
  groupBy: OrderSalesStatisticsGroupBy
): string {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);

  if (groupBy === 'day') {
    return `${year}-${month}-${padDatePart(date.getUTCDate())}`;
  }

  return `${year}-${month}`;
}

//===============================================================

const SALES_DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

//===============================================================

const SALES_MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

//===============================================================

function formatSalesPeriodLabel(
  key: string,
  groupBy: OrderSalesStatisticsGroupBy
): string {
  const date = new Date(
    `${key}${groupBy === 'month' ? '-01' : ''}T00:00:00.000Z`
  );

  return groupBy === 'day'
    ? SALES_DAY_LABEL_FORMATTER.format(date)
    : SALES_MONTH_LABEL_FORMATTER.format(date);
}

//===============================================================

function createEmptySalesValues(
  categories: readonly ProductCategoryReferenceDto[]
) {
  return categories.reduce<
    Partial<Record<string, { quantity: number; amount: number }>>
  >((acc, category) => {
    acc[category.slug] = { quantity: 0, amount: 0 };

    return acc;
  }, {});
}

//===============================================================

function createSalesPoints({
  rows,
  dateFrom,
  dateTo,
  groupBy,
  categories,
}: {
  rows: OrderSalesAggregationRow[];
  dateFrom: string;
  dateTo: string;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: ProductCategoryReferenceDto[];
}): OrderSalesStatisticsDto['points'] {
  const rowMap = new Map<string, OrderSalesAggregationRow>();

  for (const row of rows) {
    const categorySlug = row._id.categorySlug;

    if (!categorySlug) continue;

    rowMap.set(`${row._id.period}:${categorySlug}`, row);
  }

  const points: OrderSalesStatisticsDto['points'] = [];

  let cursor = getStartOfDay(dateFrom);

  const endDate = getEndOfDay(dateTo);

  if (groupBy === 'month') {
    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)
    );
  }

  while (cursor.getTime() <= endDate.getTime()) {
    const key = createSalesPeriodKey(cursor, groupBy);
    const values = createEmptySalesValues(categories);

    for (const category of categories) {
      const row = rowMap.get(`${key}:${category.slug}`);
      if (!row) continue;

      values[category.slug] = {
        quantity: row.quantity,
        amount: row.amount,
      };
    }

    points.push({
      key,
      label: formatSalesPeriodLabel(key, groupBy),
      values,
    });

    cursor = addSalesPeriod(cursor, groupBy);
  }

  return points;
}

//===============================================================

export async function getOrderSalesStatisticsService(
  userId: string,
  query: OrderSalesStatisticsQuery,
  role?: UserRole
): Promise<OrderSalesStatisticsDto> {
  const pharmacyId =
    role === USER_ROLES.PHARMACY ? await getCurrentPharmacyId(userId) : null;

  return getOrderSalesStatisticsForPharmacyService(
    pharmacyId?.toString() ?? null,
    query
  );
}

//===============================================================

export async function getOrderSalesStatisticsForPharmacyService(
  pharmacyId: string | null,
  query: OrderSalesStatisticsQuery
): Promise<OrderSalesStatisticsDto> {
  return getOrderSalesStatisticsForPharmaciesService(
    pharmacyId ? [pharmacyId] : [],
    query
  );
}

//===============================================================

export async function getOrderSalesStatisticsForPharmaciesService(
  pharmacyIds: readonly string[],
  query: OrderSalesStatisticsQuery
): Promise<OrderSalesStatisticsDto> {
  const { dateFrom, dateTo } = getDefaultSalesDateRange(query);
  const groupBy = query.groupBy;

  if (!pharmacyIds.length) {
    return {
      currency: '₴',
      groupBy,
      categories: [],

      points: createSalesPoints({
        rows: [],
        dateFrom,
        dateTo,
        groupBy,
        categories: [],
      }),
    };
  }

  const successfulAtRange = {
    $gte: getStartOfDay(dateFrom),
    $lte: getEndOfDay(dateTo),
  };

  const matchFilter: Record<string, unknown> = {
    pharmacyId: { $in: pharmacyIds.map((id) => new Types.ObjectId(id)) },
    status: 'successful',
    $or: [{ successfulAt: successfulAtRange }, { successfulAt: null }],
  };

  if (query.productId) {
    matchFilter['items.productId'] = new Types.ObjectId(query.productId);
  }

  const rows = await Order.aggregate<OrderSalesAggregationRow>([
    { $match: matchFilter },
    {
      $set: {
        _salesSuccessfulAt: {
          $ifNull: [
            '$successfulAt',
            {
              $let: {
                vars: {
                  successfulHistory: {
                    $filter: {
                      input: { $ifNull: ['$statusHistory', []] },
                      as: 'history',
                      cond: { $eq: ['$$history.status', 'successful'] },
                    },
                  },
                },
                in: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: '$$successfulHistory',
                        as: 'history',
                        in: '$$history.changedAt',
                      },
                    },
                    -1,
                  ],
                },
              },
            },
          ],
        },
      },
    },
    { $match: { _salesSuccessfulAt: successfulAtRange } },
    { $unwind: '$items' },
    {
      $match: query.productId
        ? { 'items.productId': new Types.ObjectId(query.productId) }
        : {},
    },
    {
      $group: {
        _id: {
          period: {
            $dateToString: {
              date: '$_salesSuccessfulAt',
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              timezone: 'UTC',
            },
          },

          categoryId: {
            $ifNull: ['$items.productSnapshot.categoryId', null],
          },

          categoryName: {
            $ifNull: ['$items.productSnapshot.categoryNameSnapshot', null],
          },

          categorySlug: {
            $ifNull: ['$items.productSnapshot.categorySlugSnapshot', null],
          },
        },

        quantity: { $sum: '$items.quantity' },
        amount: { $sum: '$items.totalPrice' },
      },
    },
    { $sort: { '_id.period': 1, '_id.categorySlug': 1 } },
  ]);

  const categories = [
    ...new Map(
      rows
        .filter(
          (row) =>
            row.amount > 0 &&
            row._id.categoryId &&
            row._id.categoryName &&
            row._id.categorySlug
        )

        .map((row) => [
          `${String(row._id.categoryId)}:${row._id.categorySlug}`,
          {
            id: String(row._id.categoryId),
            name: row._id.categoryName!,
            slug: row._id.categorySlug!,
          },
        ])
    ).values(),
  ].sort((left, right) =>
    left.name.localeCompare(right.name, 'en', { sensitivity: 'base' })
  );

  // Historical order snapshots preserve their category names; current color
  // is loaded from the reference dictionary so Admin Settings changes apply.
  const currentColors = await ProductCategory.find({
    _id: { $in: categories.map((category) => new Types.ObjectId(category.id)) },
  })
    .select('_id color')
    .lean<Array<{ _id: Types.ObjectId; color?: string }>>();

  const colorsById = new Map(
    currentColors.map((item) => [String(item._id), item.color] as const)
  );

  const coloredCategories = categories.map((category) => ({
    ...category,

    ...(colorsById.get(category.id)
      ? { color: colorsById.get(category.id) }
      : {}),
  }));

  return {
    currency: '₴',
    groupBy,
    categories: coloredCategories,
    points: createSalesPoints({ rows, dateFrom, dateTo, groupBy, categories }),
  };
}
