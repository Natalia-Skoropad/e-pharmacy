import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { createSafeRegExp } from '../utils/regexp';

import type {
  ClientProductsQuery,
  ClientsQuery,
} from '../schemas/client.schema';

import type { OrderEntity } from '../types/order';
import type { ProductEntity, ProductStatus } from '../types/product';
import type { ProductCategory } from '../types/categories';
import type { PharmacyEntity } from '../types/pharmacy';
import type { UserEntity } from '../types/user';

//===============================================================

type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };
type UserDocument = UserEntity & { _id: Types.ObjectId; createdAt: Date };
type ProductDocument = ProductEntity & { _id: Types.ObjectId };

//===============================================================

type ClientRow = Readonly<{
  id: string;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: 'active' | 'blocked';
  statusReason?: string;
  isDefault: boolean;
}>;

type ClientPurchasedProductRow = Readonly<{
  id: string;
  orderId: string;
  orderDate: string;
  productId: string;
  photoUrl: string | null;
  article: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  totalAmount: number;
  status: ProductStatus;
}>;

//===============================================================

async function getCurrentPharmacyId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return null;

  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<Pick<PharmacyDocument, '_id'> | null>();

  return pharmacy?._id ?? null;
}

//===============================================================

function getDeliveryAddress(order: OrderDocument): string | undefined {
  return order.delivery.method === 'postal_delivery'
    ? order.delivery.details.address
    : undefined;
}

//===============================================================

function getClientAddress(user: UserDocument, orders: OrderDocument[]): string {
  if (user.isDefaultPharmacyClient) return '';
  if (user.address) return user.address;

  const deliveryAddress = orders
    .map((order) => getDeliveryAddress(order))
    .find((address): address is string => Boolean(address));

  return deliveryAddress ?? 'Not specified';
}

//===============================================================

function getFirstOrderDate(orders: OrderDocument[], fallbackDate: Date): Date {
  return orders.reduce(
    (earliest, order) =>
      order.createdAt < earliest ? order.createdAt : earliest,
    orders[0]?.createdAt ?? fallbackDate
  );
}

//===============================================================

function serializeClient(
  user: UserDocument,
  orders: OrderDocument[],
  pharmacy: Pick<
    PharmacyDocument,
    'imageUrl' | 'activatedAt' | 'approvedAt' | 'createdAt'
  >
): ClientRow {
  const successfulOrders = orders.filter(
    (order) => order.status === 'successful'
  );
  const isDefault = Boolean(user.isDefaultPharmacyClient);
  const fallbackDate =
    pharmacy.activatedAt ??
    pharmacy.approvedAt ??
    pharmacy.createdAt ??
    user.createdAt;

  return {
    id: String(user._id),
    photoUrl: isDefault
      ? (pharmacy.imageUrl ?? null)
      : (user.pictureUrl ?? null),
    firstOrderAt: (isDefault
      ? fallbackDate
      : getFirstOrderDate(orders, fallbackDate)
    ).toISOString(),
    name: user.name,
    email: isDefault ? '' : user.email,
    phone: isDefault ? '' : user.phone,
    address: isDefault ? '' : getClientAddress(user, orders),
    successfulOrdersCount: successfulOrders.length,
    successfulOrdersAmount: successfulOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    ),
    status: isDefault
      ? 'active'
      : user.status === 'blocked'
        ? 'blocked'
        : 'active',
    ...(user.statusReason && !isDefault
      ? { statusReason: user.statusReason }
      : {}),
    isDefault,
  };
}

//===============================================================

function isWalkInClient(client: ClientRow): boolean {
  return (
    client.isDefault || client.name.trim().toLowerCase() === 'walk-in customer'
  );
}

//===============================================================

function compareClientRows(first: ClientRow, second: ClientRow): number {
  const firstIsWalkIn = isWalkInClient(first);
  const secondIsWalkIn = isWalkInClient(second);

  if (firstIsWalkIn !== secondIsWalkIn) {
    return firstIsWalkIn ? -1 : 1;
  }

  return second.firstOrderAt.localeCompare(first.firstOrderAt);
}

//===============================================================

function matchesClientFilters(client: ClientRow, query: ClientsQuery): boolean {
  if (query.clientId?.trim() && !client.id.includes(query.clientId.trim())) {
    return false;
  }

  if (
    query.name?.trim() &&
    !createSafeRegExp(query.name.trim()).test(client.name)
  ) {
    return false;
  }

  if (query.contact?.trim()) {
    const contactSearchRegExp = createSafeRegExp(query.contact.trim());

    if (
      !contactSearchRegExp.test(client.email) &&
      !contactSearchRegExp.test(client.phone) &&
      !contactSearchRegExp.test(client.address)
    ) {
      return false;
    }
  }

  if (
    query.email?.trim() &&
    !createSafeRegExp(query.email.trim()).test(client.email)
  ) {
    return false;
  }

  if (
    query.phone?.trim() &&
    !createSafeRegExp(query.phone.trim()).test(client.phone)
  ) {
    return false;
  }

  if (
    query.address?.trim() &&
    !createSafeRegExp(query.address.trim()).test(client.address)
  ) {
    return false;
  }

  if (query.status && client.status !== query.status) {
    return false;
  }

  if (query.successfulOrders === 'repeat') {
    return client.successfulOrdersCount > 1;
  }

  if (query.successfulOrders === 'successful') {
    return client.successfulOrdersCount > 0;
  }

  if (query.successfulOrders === 'other') {
    return client.successfulOrdersCount === 0;
  }

  return true;
}

//===============================================================

async function getClientRowsForPharmacy(
  pharmacyId: Types.ObjectId,
  query: ClientsQuery
): Promise<ClientRow[]> {
  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('imageUrl activatedAt approvedAt createdAt')
    .lean<Pick<
      PharmacyDocument,
      '_id' | 'imageUrl' | 'activatedAt' | 'approvedAt' | 'createdAt'
    > | null>();

  if (!pharmacy) return [];

  const orderFilter: Record<string, unknown> = { pharmacyId };

  if (query.firstOrderFrom || query.firstOrderTo) {
    orderFilter.createdAt = {
      ...(query.firstOrderFrom
        ? { $gte: getStartOfDay(query.firstOrderFrom) }
        : {}),
      ...(query.firstOrderTo ? { $lte: getEndOfDay(query.firstOrderTo) } : {}),
    };
  }

  const orders = await Order.find(orderFilter)
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  const ordersByUserId = new Map<string, OrderDocument[]>();

  for (const order of orders) {
    const userId = String(order.userId);
    const existingOrders = ordersByUserId.get(userId) ?? [];
    existingOrders.push(order);
    ordersByUserId.set(userId, existingOrders);
  }

  const users = await User.find({
    $or: [
      { _id: { $in: [...ordersByUserId.keys()] } },
      {
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      },
    ],
  }).lean<UserDocument[]>();

  return users
    .flatMap((user) => {
      const userOrders = ordersByUserId.get(String(user._id)) ?? [];

      if (!userOrders.length && !user.isDefaultPharmacyClient) return [];

      return [serializeClient(user, userOrders, pharmacy)];
    })
    .filter((client) => matchesClientFilters(client, query))
    .sort(compareClientRows);
}

//===============================================================

export async function getClientsService(userId: string, query: ClientsQuery) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    };
  }

  const [clients, earliestOrder] = await Promise.all([
    getClientRowsForPharmacy(pharmacyId, query),
    Order.findOne({ pharmacyId })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  const orderedClients = [
    ...clients.filter(isWalkInClient),
    ...clients.filter((client) => !isWalkInClient(client)),
  ];
  const skip = (query.page - 1) * query.perPage;
  const items = orderedClients.slice(skip, skip + query.perPage);

  return {
    items,
    page: clients.length === 0 ? 1 : query.page,
    perPage: query.perPage,
    total: clients.length,
    totalPages: Math.ceil(clients.length / query.perPage),

    earliestCreatedAt: earliestOrder
      ? earliestOrder.createdAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getClientByIdService(userId: string, clientId: string) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const clients = await getClientRowsForPharmacy(pharmacyId, {
    page: 1,
    perPage: 1,
    clientId,
  });

  const client = clients.find((item) => item.id === clientId);

  if (!client) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  return { client };
}

//===============================================================

function matchesClientProductFilters(
  row: ClientPurchasedProductRow,
  query: ClientProductsQuery
): boolean {
  if (
    query.article?.trim() &&
    !createSafeRegExp(query.article.trim()).test(row.article)
  ) {
    return false;
  }

  if (
    query.name?.trim() &&
    !createSafeRegExp(query.name.trim()).test(row.name)
  ) {
    return false;
  }

  if (query.category && row.category !== query.category) return false;
  if (query.status && row.status !== query.status) return false;

  if (query.dateFrom && row.orderDate < `${query.dateFrom}T00:00:00.000Z`) {
    return false;
  }

  if (query.dateTo && row.orderDate > `${query.dateTo}T23:59:59.999Z`) {
    return false;
  }

  return true;
}

//===============================================================

export async function getClientPurchasedProductsService(
  userId: string,
  clientId: string,
  query: ClientProductsQuery
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const orders = await Order.find({
    pharmacyId,
    userId: new Types.ObjectId(clientId),
    status: 'successful',
  })
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  if (!orders.length) {
    const [clientHasOrders, defaultClientExists] = await Promise.all([
      Order.exists({
        pharmacyId,
        userId: new Types.ObjectId(clientId),
      }),
      User.exists({
        _id: new Types.ObjectId(clientId),
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    if (!clientHasOrders && !defaultClientExists) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
    }

    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    };
  }

  const productIds = [
    ...new Set(
      orders.flatMap((order) =>
        order.items.map((item) => item.productId.toString())
      )
    ),
  ].map((productId) => new Types.ObjectId(productId));

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name article category imageUrl status')
    .lean<ProductDocument[]>();

  const productsById = new Map(
    products.map((product) => [String(product._id), product])
  );

  const rows = orders
    .flatMap((order) =>
      order.items.map((item, itemIndex): ClientPurchasedProductRow => {
        const productId = item.productId.toString();
        const product = productsById.get(productId);
        const category =
          product?.category ?? item.productSnapshot.category ?? 'other';

        return {
          id: `${order._id.toString()}-${item._id?.toString() ?? itemIndex}`,
          orderId: order._id.toString(),
          orderDate: order.createdAt.toISOString(),
          productId,
          photoUrl: product?.imageUrl ?? item.productSnapshot.imageUrl ?? null,
          article: product?.article ?? item.productSnapshot.article,
          name: product?.name ?? item.productSnapshot.name,
          category,
          quantity: item.quantity,
          totalAmount: item.totalPrice,
          status: product?.status ?? 'blocked',
        };
      })
    )
    .filter((row) => matchesClientProductFilters(row, query))
    .sort((left, right) => right.orderDate.localeCompare(left.orderDate));

  const skip = (query.page - 1) * query.perPage;
  const items = rows.slice(skip, skip + query.perPage);

  return {
    items,
    page: rows.length === 0 ? 1 : query.page,
    perPage: query.perPage,
    total: rows.length,
    totalPages: Math.ceil(rows.length / query.perPage),
    earliestCreatedAt:
      orders[orders.length - 1]?.createdAt.toISOString().slice(0, 10) ?? null,
  };
}
